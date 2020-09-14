// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "../account/Account.sol";
import "../account/AccountFactory.sol";
import "../library/integration/IBasketCore.sol";
import "../library/integration/IBasketManager.sol";

/**
 * @dev Application to mint and redeem basket tokens.
 */
contract MintRedeemApplication {

    address private _basketManagerAddress;
    address private _accountFactoryAddress;

    constructor (address basketManagerAddress, address accountFactoryAddress) public {
        require(_basketManagerAddress == address(0x0), "MintRedeemApplication: Already initialized");
        require(basketManagerAddress != address(0x0), "MintRedeemApplication: Basket manager not set");
        require(accountFactoryAddress != address(0x0), "MintRedeemApplication: Account factory not set");

        _basketManagerAddress = basketManagerAddress;
        _accountFactoryAddress = accountFactoryAddress;
    }

    /**
     * @dev Mints BasketToken with underlying assets from the Account contract. MintRedeemApplication must be granted
     * the operator role of the Account contract in order to proceed.
     * @param tokenAddresses The list of the underlying assets to mint.
     * @param amounts The amounts of each underlying assets to mint.
     * @return The total amount of BasetToken minted.
     */
    function mint(address[] memory tokenAddresses, uint256[] memory amounts) public returns (uint256) {
        Account account = AccountFactory(_accountFactoryAddress).getAccount(msg.sender);
        require(address(account) != address(0x0), "MintRedeemApplication: Account not exist");
        require(account.isOperator(address(this)), "MintRedeemApplication: Not an operator");

        // Allow BasketCore to spend tokens
        address basketCoreAddress = IBasketManager(_basketManagerAddress).getBasketCore();
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            account.approveToken(tokenAddresses[i], basketCoreAddress, amounts[i]);
        }

        // Since minting only contains token transfers, we can invoke it direclty from the Account contract.
        bytes memory methodData = abi.encodeWithSignature("mint(address[],uint256[])", tokenAddresses, amounts);
        bytes memory mintData = account.invoke(_basketManagerAddress, 0, methodData);

        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            // Be a good citizen. Reset the allowance to 0.
            account.approveToken(tokenAddresses[i], basketCoreAddress, 0);
        }

        return abi.decode(mintData, (uint256));
    }

    /**
     * @dev Proportionally redeems the BasketToken from the Account contract. MintRedeemApplication must be granted
     * the operator role of the Account contract in order to proceed.
     * @param amount Amount of BasketToken to redeem.
     * @return tokenAddresses amounts The addresses and amounts of the underlying tokens redeemed.
     */
    function redeem(uint256 amount) public returns (address[] memory tokenAddresses, uint256[] memory amounts) {
        Account account = AccountFactory(_accountFactoryAddress).getAccount(msg.sender);
        require(address(account) != address(0x0), "MintRedeemApplication: Account not exist");
        require(account.isOperator(address(this)), "MintRedeemApplication: Not an operator");

        // Allow BasketCore to spend tokens
        address basketCoreAddress = IBasketManager(_basketManagerAddress).getBasketCore();
        address basketTokenAddress = IBasketCore(basketCoreAddress).getBasketToken();
        account.approveToken(basketTokenAddress, basketCoreAddress, amount);

        // Since redemption only contains token transfers, we can invoke it directly from the Account contract for simplicity.
        bytes memory methodData = abi.encodeWithSignature("redeem(uint256)", amount);
        bytes memory redeemData = account.invoke(_basketManagerAddress, 0, methodData);

        // Be a good citizen. Reset the allowance to 0.
        account.approveToken(basketTokenAddress, basketCoreAddress, 0);

        return abi.decode(redeemData, (address[], uint256[]));
    }

    /**
     * @dev Calculates the tokens and amounts redeemed.
     * @param amount Amount of BasketToken to redeem.
     * @return tokenAddresses amounts The addresses and amounts of the underlying tokens redeemed.
     */
    function getRedemptionAmounts(uint256 amount) public view returns (address[] memory tokenAddresses, uint256[] memory amounts) {
        return IBasketManager(_basketManagerAddress).getRedemptionAmounts(amount);
    }

    /**
     * @dev Retrieves the address of the BasketManager contract.
     */
    function getBasketManager() public view returns (address) {
        return _basketManagerAddress;
    }

    /**
     * @dev Retrieves the address of the AccountFactory contract.
     */
    function getAccountFactory() public view returns (address) {
        return _accountFactoryAddress;
    }
}