//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Pool.sol";
import "../libraries/Types.sol";

//maybe create a whitelist to let only known investors to create new tranches to avoid that the array become too big
contract Factory {
    address                                                 Admin;
    mapping(address => Types.PoolVariables[]) public        AssetTranches;
    mapping(address => uint256) public                      AssetIndexes;

    event NewPoolCreated(address indexed, address indexed, uint256 indexed);

    constructor() {
        Admin = msg.sender;
    }

    /*//////////////////////////////////////////////////////////////
                        POOL CREATION FUNCTION
    //////////////////////////////////////////////////////////////*/

    // don't let pool created with the same structure as the one before thanks to a big mapping address => uint => uint => bool => state
    function createNewPool(
        address                     _asset, 
        address                     _pool, 
        address                     _poolProvider,
        address                     _poolToken,
        address                     _managerContract,
        string calldata             _name, 
        string calldata             _symbol,  
        Types.PoolVariables memory  _variables
        ) public {
        //make sure fixed yiels id 4 digits long, how? (fixedYield/ 1000 > 0) but (fixedYield/ 10000 == 0)
        uint256 index = AssetTranches[_asset].length;
        Pool LevPool = new Pool(
            string(abi.encodePacked("Lev", _name)), 
            string(abi.encodePacked("Lev", _symbol)), 
            _asset, 
            _pool, 
            _poolProvider, 
            _poolToken, 
            _managerContract,
            true, 
            index
        );
        Pool FixPool = new Pool(
            string(abi.encodePacked("Fix", _name)), 
            string(abi.encodePacked("Fix", _symbol)), 
            _asset, 
            _pool, 
            _poolProvider, 
            _poolToken, 
            _managerContract,
            false, 
            index
        );
        require(
            address(LevPool) != address(0) && address(FixPool) != address(0)
        );
        AssetTranches[_asset].push(Types.PoolVariables(
            msg.sender,
            address(FixPool),
            address(LevPool),
            _variables.FixedYield,
            _variables.LRmin,
            _variables.LRmax,
            block.timestamp,
            block.timestamp + 24 weeks,
            _variables.WithdrawLockPeriod,
            Types.State.BOOTSTRAP
        ));
        AssetIndexes[_asset] = index + 1;
        emit NewPoolCreated(msg.sender, _asset, index);
    }

    function returnTranchesByIndex(address _asset, uint256 index) public view returns (Types.PoolVariables memory) {
        return AssetTranches[_asset][index];
    }

    function changePoolState(address _asset, uint256 index, Types.State newState) external {
        Types.PoolVariables memory Variables = returnTranchesByIndex(_asset, index);
        require(msg.sender == Pool(Variables.FixPool).ManagerContract() || msg.sender == Admin);
        AssetTranches[_asset][index].CurrentState = newState;
    }
}
