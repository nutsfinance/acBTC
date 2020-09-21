// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../acoconut/IMigrator.sol";
import "../mock/MockToken.sol";

/**
 * @dev Mock migrator implementation.
 */
contract MockMigrator is IMigrator {
    address public override want;
    address public override get;
    address public vault;

    constructor(address _want, address _get, address _vault) public {
        want = _want;
        get = _get;
        vault = _vault;
    }

    function migrate() external override {
        uint256 balance = IERC20(want).balanceOf(address(this));
        uint256 newBalance = balance * 120 / 100;

        MockToken(want).burn(address(this), balance);
        MockToken(get).mint(vault, newBalance);
    }
}