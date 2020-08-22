// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./BasketToken.sol";

/**
 * @notice Core of the composite token basket.
 * @dev The main functionality of BasketCore is to maintain the following invariant:
 *          Total supply of basket token = Sum of token balances
 * @dev BasketCore is the owner of BasketToken, so it mints and burns BasketToken.
 * It does not manage the token basket which is the responsibility of BasketManager.
 * @dev BasketCore only handle one-to-one minting, redemption and swap. 
 */
contract BasketCore is Ownable {

    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    event Minted(address indexed sourceAddress, address indexed tokenAddress, uint256 amount, uint256 mintAmount);
    event Redeemed(address indexed sourceAddress, address indexed tokenAddress, uint256 amount, uint256 redemptionAmount);
    event Swapped(address indexed sourceAddress, address indexed inputToken, address indexed outputToken, uint256 inputAmount, uint256 outputAmount);

    BasketToken private _basketToken;
    mapping(address => uint256) private _tokenBalances;
    address private _feeAddress;

    /**
     * @dev Mints new basket token by depositing underlying asset. For minting, if there is any mint fee,
     * it must be charged with the basket token.
     * @param sourceAddress The address of the user who mints new basket tokens.
     * @param tokenAddress The address of the underlying asset deposited.
     * @param amount The amount of underlying asset deposited.
     * @param feeAmount The amount fee charged on minting.
     * @return The amount of basket token minted.
     */
    function mint(address sourceAddress, address tokenAddress, uint256 amount, uint256 feeAmount) public onlyOwner returns (uint256) {
        require(sourceAddress != address(0x0), "Source address is not set");
        require(tokenAddress != address(0x0), "Token address is not set");
        require(amount > 0, "Amount is not set");

        _safeTransferIn(sourceAddress, tokenAddress, amount);
        _tokenBalances[tokenAddress] = _tokenBalances[tokenAddress].add(amount);

        uint256 mintAmount = amount.sub(feeAmount);
        if (feeAmount > 0) {
            // If there is any minting fee, it must be charged using basket token!
            _basketToken.mint(_feeAddress, feeAmount);
        }
        _basketToken.mint(sourceAddress, mintAmount);
        emit Minted(sourceAddress, tokenAddress, amount, mintAmount);

        return mintAmount;
    }

    /**
     * @dev Redeems basket tokens and withdraws the underlying asset. For redemption, if there is any redemption fee,
     * it must be charged with the basket token.
     * @param sourceAddress The address of the user who redeems existing basket tokens.
     * @param tokenAddress The address of the underlying asset to withdraw.
     * @param amount The amount of basket token to redeem.
     * @param feeAmount The amount of fee charged on redemption.
     * @return The amount of underlying asset withdrawn.
     */
    function redeem(address sourceAddress, address tokenAddress, uint256 amount, uint256 feeAmount) public onlyOwner returns (uint256) {
        require(sourceAddress != address(0x0), "Source address is not set");
        require(tokenAddress != address(0x0), "Token address is not set");
        require(amount > 0, "Amount is not set");
        require(amount <= _tokenBalances[tokenAddress], "Insufficient token balance");

        uint256 redemptionAmount = amount.sub(feeAmount);
        _tokenBalances[tokenAddress] = _tokenBalances[tokenAddress].sub(redemptionAmount);

        _safeTransferIn(sourceAddress, address(_basketToken), amount);
        if (feeAmount > 0) {
            // If there is any redemption fee, it must be charged using the basket token!
            _basketToken.transfer(_feeAddress, feeAmount);
        }
        IERC20(tokenAddress).safeTransfer(sourceAddress, redemptionAmount);
        emit Redeemed(sourceAddress, tokenAddress, amount, redemptionAmount);

        return redemptionAmount;
    }

    /**
     * @dev Swaps two underlying assets. The swap fee can be charged in either input token or output token.
     * @param sourceAddress The address of the user who swaps underlying assets.
     * @param inputToken The address of the input token.
     * @param outputToken The address of the output token.
     * @param amount The amount of input token to swap in.
     * @param inputFee The amount of input token to pay as fee, if any.
     * @param outputFee The amount of output token to pay as fee, if any.
     * @return The amount of output token swap out.
     */
    function swap(address sourceAddress, address inputToken, address outputToken, uint256 amount, uint256 inputFee, uint256 outputFee) public onlyOwner returns (uint256) {
        require(sourceAddress != address(0x0), "Source address is not set");
        require(inputToken != address(0x0), "Input token is not set");
        require(outputToken != address(0x0), "Output token is not set");
        require(amount > 0, "Amount is not set");
        require(_tokenBalances[outputToken] >= amount, "Insufficient output balance");

        uint256 amountMinusInputFee = amount.sub(inputFee);
        uint256 outputAmount = amountMinusInputFee.sub(outputFee);
        _tokenBalances[inputToken] = _tokenBalances[inputToken].add(amountMinusInputFee);
        _tokenBalances[outputToken] = _tokenBalances[outputToken].sub(outputAmount);

        _safeTransferIn(sourceAddress, inputToken, amount);
        if (inputFee > 0) {
            // If there is any swap fee charged with input token
            IERC20(inputToken).safeTransfer(inputToken, inputFee);
        }
        if (outputFee > 0) {
            // If there is any swap fee charged with output token
            IERC20(outputToken).safeTransfer(outputToken, outputFee);
        }
        IERC20(outputToken).safeTransfer(sourceAddress, outputAmount);
        emit Swapped(sourceAddress, inputToken, outputToken, amount, outputAmount);

        return outputAmount;
    }

    /**
     * @dev Safely transfer token from source address.
     */
    function _safeTransferIn(address sourceAddress, address tokenAddress, uint256 amount) internal {
        uint256 prevBalance = IERC20(tokenAddress).balanceOf(address(this));
        IERC20(tokenAddress).safeTransferFrom(sourceAddress, address(this), amount);
        uint256 currBalance = IERC20(tokenAddress).balanceOf(address(this));
        require(prevBalance.add(amount) == currBalance, "Incorrect transfer amount");
    }
}