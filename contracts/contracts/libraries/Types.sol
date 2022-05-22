//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

library Types {
    enum State      { BOOTSTRAP, ACTIVE, CLOSED }
    enum LFState    { BALANCED, OUTMIN, OUTMAX }

    struct PoolVariables {
        address Creator;
        address FixPool;
        address LevPool;
        uint256 FixedYield;
        uint256 LRmin;
        uint256 LRmax;
        uint256 CreatedAt;
        uint256 Deadline;
        uint256 WithdrawLockPeriod;
        State   CurrentState;
    }

    struct DepositingAmount {
        uint256 amount;
        uint256 timestamp;
    }
}