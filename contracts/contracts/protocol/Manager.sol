//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../libraries/Types.sol";
import "../libraries/Ratio.sol";
import "./Factory.sol";
import "./Pool.sol";
import {ERC20} from "@rari-capital/solmate/src/tokens/ERC20.sol";
import {DataTypes} from '@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol';
import {IPool} from '@aave/core-v3/contracts/interfaces/IPool.sol';

contract Manager {
    address                         FactoryContract;
    mapping(address => uint256)     LastHarvestedAmount;
    mapping(address => uint256)     LastHarvestedTime; 

    constructor(address _FactoryContract) {
        FactoryContract = _FactoryContract;
    }

    /*//////////////////////////////////////////////////////////////
                            MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyBootstrap(address asset, uint256 index)  {
        Types.PoolVariables memory Variables = returnTranchesByIndex(asset, index);
        require(Variables.CurrentState == Types.State.BOOTSTRAP);
        _;
    }

    modifier onlyActive(address asset, uint256 index)  {
        Types.PoolVariables memory Variables = returnTranchesByIndex(asset, index);
        require(Variables.CurrentState == Types.State.ACTIVE);
        _;
    }

    /*//////////////////////////////////////////////////////////////
                        POOL INFORMATION
    //////////////////////////////////////////////////////////////*/

    function returnTranchesByIndex(address _asset, uint256 index) public view returns (Types.PoolVariables memory) {
        return Factory(FactoryContract).returnTranchesByIndex(_asset, index);
    }

    function checkLeverageFactor(address _asset, uint256 index) public view returns(Types.LFState) {
        Types.PoolVariables memory Variables = returnTranchesByIndex(_asset, index);
        uint256 FixPoolAmount = Pool(Variables.FixPool).totalAssets();
        uint256 LevPoolAmount = Pool(Variables.LevPool).totalAssets();
        return (RatioCalculation.checkLeverageFactor(FixPoolAmount, LevPoolAmount, Variables.LRmin, Variables.LRmax));
    }

    function getLiquidityRate(address _asset, uint256 index) public view returns(uint128, uint40) {
        Types.PoolVariables memory Variables = returnTranchesByIndex(_asset, index);
        IPool ProviderPool = Pool(Variables.FixPool).pool();
        DataTypes.ReserveData memory reserve = ProviderPool.getReserveData(_asset);
        require(reserve.lastUpdateTimestamp != 0, "The pool was not updated recently");
        return (reserve.currentLiquidityRate, reserve.lastUpdateTimestamp);
    }

    /*//////////////////////////////////////////////////////////////
                        POOL MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    function closeBoostrapPeriod(address _asset, uint256 index) onlyBootstrap(_asset, index) external {
        Types.PoolVariables memory Variables = returnTranchesByIndex(_asset, index);
        require(block.timestamp >= Variables.CreatedAt + Variables.WithdrawLockPeriod, "Bootstrap period not finished");
        uint256 FixPoolAmount = Pool(Variables.FixPool).totalAssets();
        uint256 LevPoolAmount = Pool(Variables.LevPool).totalAssets();
        Types.LFState leverageRatio = RatioCalculation.checkLeverageFactor(FixPoolAmount, LevPoolAmount, Variables.LRmin, Variables.LRmax);
        if (leverageRatio != Types.LFState.BALANCED) {
            rebalancePools(leverageRatio, _asset, index);
        }
        LastHarvestedAmount[Variables.FixPool] = FixPoolAmount;
        LastHarvestedTime[Variables.FixPool] = block.timestamp;
        Factory(FactoryContract).changePoolState(_asset, index, Types.State.ACTIVE);
    }

    function closeActivePeriod(address _asset, uint256 index) onlyActive(_asset, index) external {
        Types.PoolVariables memory Variables = returnTranchesByIndex(_asset, index);
        require(block.timestamp > Variables.Deadline, "Active period not finished");
        Factory(FactoryContract).changePoolState(_asset, index, Types.State.CLOSED);
    }

    function rebalancePools(Types.LFState rebalanceType, address _asset, uint256 index) internal {
        //Make a loop through the last backers and check their ongoing amount, remove out until we reach the right amount
        Types.PoolVariables memory Variables = Factory(FactoryContract).returnTranchesByIndex(_asset, index);
        uint256 FixPoolAmount = Pool(Variables.FixPool).totalAssets();
        uint256 LevPoolAmount = Pool(Variables.LevPool).totalAssets();
        uint256 CurrLR = RatioCalculation.calculateLeverageFactor(FixPoolAmount, LevPoolAmount);
        if (rebalanceType == Types.LFState.OUTMAX) {
            // Too much Fixed Pool
            uint256 target = ((CurrLR -  Variables.LRmax) * LevPoolAmount * 110) / 100; // A' = A - (oldLF - LFmax)B; so we need to remove: (oldLF - LFmax) * B from the Fixed Pool. Buffer of 10%.
            handleRebalancing(Variables.FixPool, target);          
        } 
        //else {
        //     // Too much LeveragePool
        //     uint256 target = (((Variables.LRmin - CurrLR)/(Variables.LRmin * CurrLR)) * FixPoolAmount * 110) / 100; // B' = B - ((minLF -oldLF)/(minLF * oldLF)) * A; so we need to remove: ((minLF -oldLF)/(minLF * oldLF)) * A from the Leverage Pool. Buffer of 10%.
        //     handleRebalancing(Variables.LevPool, target);
        // }
    }

    function handleRebalancing(address PoolToRebalance, uint256 target) internal {
        address[] memory backersArray = Pool(PoolToRebalance).getBackers();
        uint256 length = backersArray.length - 1;
        for (uint256 i = length; i > 1; i--) {
            uint256 amount = Pool(PoolToRebalance).getDeposit(backersArray[i]);
            if (amount < target) {
                Pool(PoolToRebalance).setDeposit(backersArray[i], 0);
                target -= amount;
                Pool(PoolToRebalance).withdraw(amount, backersArray[i], backersArray[i]);
            } 
            else {
                Pool(PoolToRebalance).setDeposit(backersArray[i], amount - target);
                Pool(PoolToRebalance).withdraw(target, backersArray[i], backersArray[i]);
                target = 0;
                break;
            }
        }
    }

    function harvest(address _asset, uint256 index) onlyActive(_asset, index) public {
        Types.PoolVariables memory Variables = Factory(FactoryContract).returnTranchesByIndex(_asset, index);
        require(block.timestamp > LastHarvestedTime[Variables.FixPool] + 7 days, "You must wait to harvest.");
        uint256 currentFixedAmount = Pool(Variables.FixPool).totalAssets();
        require(currentFixedAmount >= LastHarvestedAmount[Variables.FixPool], "Never out money."); //dangerous because can block the harvest
        
        uint256 EffectiveYield = RatioCalculation.calculateYield(LastHarvestedAmount[Variables.FixPool], currentFixedAmount - LastHarvestedAmount[Variables.FixPool]);
        uint256 ExpectedYield = Variables.FixedYield / 52; // problem of division by 52 that could break the real amount.
        
        // How to handle when we have switch between currentFixedAmount and money inside the pool the last time greater than 10 ** 12 (should put a hard cap?)
        if (EffectiveYield > ExpectedYield) {
            //Move from Fixed to Leverage
            uint256 amountToMove = ((EffectiveYield - ExpectedYield) * LastHarvestedAmount[Variables.FixPool]) / 10 ** 12; // to review with problem of decimals  
            Pool(Variables.FixPool).balancePools(Variables.LevPool, amountToMove);
        } 
        else if (EffectiveYield < ExpectedYield) {
            //Move from Leverage to Fixed
            uint256 amountToMove = ((ExpectedYield - EffectiveYield) * LastHarvestedAmount[Variables.FixPool]) / 10 ** 12;
            Pool(Variables.LevPool).balancePools(Variables.FixPool, amountToMove);
        }
        // is it safe to check after? You need to check the possible implication!
        LastHarvestedAmount[Variables.FixPool] = currentFixedAmount;
        LastHarvestedTime[Variables.FixPool] = block.timestamp;
    }
}