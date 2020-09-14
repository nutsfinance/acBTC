// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

/**
 * @notice Interface for BasketManager.
 */
interface IBasketManager {

    /**
     * @dev Retrieve the address of the BasketCore contract.
     */
    function getBasketCore() external view returns (address);

    /**
     * @dev Mints new basket token with underlying tokens.
     * @param tokenAddresses The addresses of the underlying tokens deposited.
     * @param amounts The amounts of underlying tokens deposited.
     * @return The amount of basket token minted.
     */
    function mint(address[] calldata tokenAddresses, uint256[] calldata amounts) external returns (uint256);

    /**
     * @dev Proportionally redeem the basket token.
     * @param amount The amount of basket token to redeem.
     * @return tokenAddresses The underlying tokens and their amounts withdrawn.
     */
    function redeem(uint256 amount) external returns (address[] memory tokenAddresses, uint256[] memory amounts);

    /**
     * @dev Computes the redemption amounts for proportional redemption. Read-only version of redeem() method.
     * @param amount The amount of basket token to redeem.
     * @return tokenAddresses The underlying tokens and their amounts withdrawn.
     */
    function getRedemptionAmounts(uint256 amount) external view returns (address[] memory tokenAddresses, uint256[] memory amounts);
}