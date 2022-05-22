// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.0;

import {ERC20} from "@rari-capital/solmate/src/tokens/ERC20.sol";

/**
 * @title ERC20Mintable
 * @dev ERC20 minting logic
 */
contract MintableERC20 is ERC20 {
  constructor(
    string memory name,
    string memory symbol,
    uint8 decimals
  ) ERC20(name, symbol, decimals) {}

    /* 
    ***
    FUNCTIONS TO INTERACT WITH THE ERC20 implementation
    ***
    */

  function mint(uint256 amount) public {
      _mint(msg.sender, amount);
  } 

  function burn(uint256 amount) public {
      _burn(msg.sender, amount);
  } 
}
