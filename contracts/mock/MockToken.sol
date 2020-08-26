// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @notice Mock ERC20 tokens used for testing.
 */
contract MockToken is ERC20 {

    constructor(string memory name, string memory symbol) ERC20(name, symbol) public {}

    function mint(uint256 amount) public {
        _mint(msg.sender, amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}