//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

interface ILenPool {
    function totalAssets() external returns(uint256);
    function getLiquidityRate(address _asset) external returns(uint128);
    function verifyWithdrawalPeriodRespected() external returns(bool);
    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) external returns (uint256 shares);
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
}