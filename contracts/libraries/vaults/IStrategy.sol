// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

/**
 * @notice Interface for Strategies.
 */
interface IStrategy {

    /**
     * @dev Returns the token address that the strategy expects.
     */
    function want() external view returns (address);

    /**
     * @dev Returns the total amount of tokens deposited in this strategy.
     */
    function balanceOf() external view returns (uint256);

    /**
     * @dev Deposits the token to start earning.
     */
    function deposit() external;

    /**
     * @dev Withdraws partial funds from the strategy.
     */
    function withdraw(uint256 amount) external;

    /**
     * @dev Withdraws all funds from the strategy.
     */
    function withdrawAll() external returns (uint256);
    
    /**
     * @dev Claims CRV from Curve and convert it back to renCRV.
     */
    function harvest() external returns (uint256);
}