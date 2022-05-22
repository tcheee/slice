//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import {IPool} from '@aave/core-v3/contracts/interfaces/IPool.sol';
import {ERC20} from "@rari-capital/solmate/src/tokens/ERC20.sol";
import {DataTypes} from '@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol';
import '@aave/core-v3/contracts/misc/AaveProtocolDataProvider.sol';
import "../external/ERC4626.sol";
import "../libraries/Types.sol";
import "../libraries/Ratio.sol";
import "../interfaces/ILenPool.sol";
import "./Manager.sol";
import "./Manager.sol";

contract Pool is ERC4626 {
    using SafeTransferLib for ERC20;

    address public                                      ManagerContract;
    address                                             underlyingToken;
    address                                             atoken;
    bool                                                LeveragePool;
    uint256                                             TrancheIndex;
    IPool public                                        pool;
    AaveProtocolDataProvider                            dataProvider;
    address[]                                           backers;
    mapping(address => Types.DepositingAmount)          UserDeposit;

    constructor(
        string memory   _name,
        string memory   _symbol,
        address         _asset,
        address         _aave_pool, 
        address         _aave_provider,
        address         _atoken,
        address         _managerContract,
        bool            _leveragePool,
        uint256         _TrancheIndex
    ) ERC4626(ERC20(_asset), _name, _symbol) {
        ManagerContract = _managerContract;
        pool = IPool(_aave_pool);
        dataProvider = AaveProtocolDataProvider(_aave_provider);
        atoken = _atoken;
        underlyingToken = _asset;
        LeveragePool = _leveragePool;
        TrancheIndex = _TrancheIndex;
    }

    /*//////////////////////////////////////////////////////////////
                            MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyManager {
        require(msg.sender == ManagerContract, "Not authorized to call");
        _;
    }

    /*//////////////////////////////////////////////////////////////
                            FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getBackers() external view returns(address[] memory) {
        return backers;
    }

    function getDeposit(address depositor) external view returns(uint256 amount) {
        return UserDeposit[depositor].amount;
    }

    function setDeposit(address depositor, uint256 amount) external onlyManager {
        UserDeposit[depositor].amount = amount;
    }

    function balancePools(address _target, uint256 _amount) public onlyManager {
        Types.PoolVariables memory Variables = Manager(ManagerContract).returnTranchesByIndex(underlyingToken, TrancheIndex);
        require (_target == Variables.FixPool || _target == Variables.LevPool);
        ERC20(atoken).transfer(_target, _amount);
    }

    /*//////////////////////////////////////////////////////////////
                    OVERRIDING ERC4626 FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function totalAssets() override public view returns(uint256) {
        return ERC20(atoken).balanceOf(address(this));
    }

    function afterDeposit(uint256 assets, uint256 shares) override internal  {
        Types.PoolVariables memory Variables = Manager(ManagerContract).returnTranchesByIndex(underlyingToken, TrancheIndex);
        if (Variables.CurrentState == Types.State.ACTIVE) {
            require(Manager(ManagerContract).checkLeverageFactor(underlyingToken, TrancheIndex) != Types.LFState.BALANCED, "The Leverage Factor would be out of bound.");
        }
        updateBackersArray();
        updateTimestamp(assets, Variables.WithdrawLockPeriod);
        ERC20(asset).approve(address(pool), assets);
        pool.supply(underlyingToken, assets, address(this), 0);
    }

    function beforeWithdraw(uint256 assets, uint256 shares) override internal {
        //require(msg.sender == ManagerContract || balanceOf[msg.sender] <= assets, "Not authorized to withdraw");
        Types.PoolVariables memory Variables = Manager(ManagerContract).returnTranchesByIndex(underlyingToken, TrancheIndex);
        require(assets > 0 && (assets / 5) != 0, 'You must withdraw a non-zero amount or a bigger amount.');

        if (Variables.CurrentState == Types.State.ACTIVE) {
            require(Manager(ManagerContract).checkLeverageFactor(underlyingToken, TrancheIndex) != Types.LFState.BALANCED, "The Leverage Factor would be out of bound.");
            if (!hasRespectedWithdrawalPeriod(Variables.WithdrawLockPeriod)) {
                assets = (assets / 5) * 3;
            }
        } 
        pool.withdraw(underlyingToken, assets, address(this));
    }

    function mint(uint256 shares, address receiver) override public view returns(uint256 assets) {
        require(1 == 0, 'only way to provide liquidity is by using deposit');
        return 0;
    }

    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) override public returns(uint256 assets) {
        require(1 == 0, 'only way to provide liquidity is by using deposit');
        return 0;
    }

    /*//////////////////////////////////////////////////////////////
                    INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function updateTimestamp(uint256 amount, uint256 LockPeriod) internal {
        Types.DepositingAmount storage LastDeposit = UserDeposit[msg.sender];
        LastDeposit.timestamp = block.timestamp;
        if (block.timestamp < LastDeposit.timestamp + LockPeriod) {
            LastDeposit.amount += amount;
        } else {
            LastDeposit.amount = amount;
        }
    }

    function updateBackersArray() internal {
        Types.DepositingAmount memory LastDeposit = UserDeposit[msg.sender];
        if (LastDeposit.timestamp == 0) {
            backers.push(msg.sender);    
        }
    }
    
    function hasRespectedWithdrawalPeriod(uint256 LockPeriod) internal view returns(bool) {
        Types.DepositingAmount memory LastDeposit = UserDeposit[msg.sender];
        if (block.timestamp < LastDeposit.timestamp + LockPeriod) {
            return false;
        }
        return true;
    }
}
