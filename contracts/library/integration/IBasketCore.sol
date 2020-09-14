// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

/**
 * @notice Interface for BasketCore.
 */
interface IBasketCore {

    /**
     * @dev Retrieves the fee receiver contract address.
     */
    function getFeeReceiver() external view returns (address);

    /**
     * @dev Retrieves the BasketToken contract address.
     */
    function getBasketToken() external view returns (address);

    /**
     * @dev Returns the current balance of the underlying asset.
     */
    function getTokenBalance(address tokenAddress) external view returns (uint256);
}