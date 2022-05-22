//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Types.sol";

library  RatioCalculation {
    function calculateLeverageFactor(
        uint256 FixPoolAmount,
        uint256 LevPoolAmount
    ) public pure returns(uint256) {
        require (FixPoolAmount > 0 && LevPoolAmount > 0, "There is a problem with the amount in the pools.");
        return FixPoolAmount / LevPoolAmount;
    }

    function checkLeverageFactor(
        uint256 FixPoolAmount,
        uint256 LevPoolAmount,
        uint256 LFmin,
        uint256 LFmax
    ) public pure returns(Types.LFState) {
        uint256 LF = calculateLeverageFactor(FixPoolAmount, LevPoolAmount);
        if (LF > LFmin  && LF < LFmax) {
            return Types.LFState.BALANCED; // All good.
        }
        if (LF >= LFmax) {
            return Types.LFState.OUTMAX; // Too much Fixed Pool
        }
        if (LF <= LFmin) {
            return Types.LFState.OUTMIN; // Too much Leverage Pool
        }
        require(1 == 0, "There was an issue with the leverage calculation");
    }

    //Testing Function checkLeverageFactor
    function TestCheckLeverageFactor(        
        uint256 FixPoolAmount,
        uint256 LevPoolAmount,
        uint256 LFmin,
        uint256 LFmax
        ) public pure returns(uint256) {
        Types.LFState result = checkLeverageFactor(
        FixPoolAmount,
        LevPoolAmount,
        LFmin,
        LFmax);
        return uint256(result);
    }

    function calculateYield (
        uint256 amountBeforeHarvest,
        uint256 rewardsAmount
    ) external pure returns(uint256) {
        require(amountBeforeHarvest > 0, "There is an issue with the amount in the pool.");
        uint256 yield = (rewardsAmount * 10 ** 12) / amountBeforeHarvest;
        return yield;
    }
}
