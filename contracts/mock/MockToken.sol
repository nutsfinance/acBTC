// SPDX-License-Identifier: MIT
pragma solidity 0.6.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @notice Mock ERC20 token.
 */
contract MockToken is ERC20 {

    constructor(string memory name, string memory symbol, uint8 decimals) ERC20(name, symbol) public {
        _setupDecimals(decimals);
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }
}