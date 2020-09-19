// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "../libraries/vaults/IStrategy.sol";
import "./MockToken.sol";

/**
 * @dev Mock strategy implementation.
 */
contract MockStrategy is IStrategy {

    MockToken public token;
    address public vault;

    constructor(address _token, address _vault) public {
        token = MockToken(_token);
        vault = _vault;
    }

    /**
     * @dev Returns the token address that the strategy expects.
     */
    function want() public view override returns (address) {
        return address(token);
    }

    /**
     * @dev Returns the total amount of tokens deposited in this strategy.
     */
    function balanceOf() public view override returns (uint256) {
        return token.balanceOf(address(this));
    }

    /**
     * @dev Deposits the token to start earning.
     */
    function deposit() public override {
        // NO OP
    }

    /**
     * @dev Withdraws partial funds from the strategy.
     */
    function withdraw(uint256 _amount) public override {
        token.transfer(vault, _amount);
    }

    /**
     * @dev Withdraws all funds from the strategy.
     */
    function withdrawAll() public override returns (uint256) {
        withdraw(balanceOf());
    }
    
    /**
     * @dev Claims CRV from Curve and convert it back to renCRV.
     */
    function harvest() public override {
        // Mint 20% token to simulate 20% yield.
        token.mint(address(this), balanceOf() * 20 / 100);
    }
}