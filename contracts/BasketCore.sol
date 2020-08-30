// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./Initializable.sol";
import "./Ownable.sol";
import "./receiver/IFeeReceiver.sol";
import "./BasketToken.sol";

/**
 * @notice Core of the composite token basket.
 * @dev The main functionality of BasketCore is to maintain the following invariant:
 *          Total supply of basket token = Sum of underlying token balances
 * @dev Only BasketCore can mint and burn BasketToken. It does not manage the underlying tokens though,
 * which is the responsibility of BasketManager.
 * @dev Users who want to mint or swap must approve to the BasketCore.
 */
contract BasketCore is Ownable, Initializable {

    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /**
     * @dev New basket tokens are minted with underlying tokens.
     */
    event Minted(address indexed sourceAddress, address indexed tokenAddress, uint256 amount, uint256 mintAmount);

    /**
     * @dev Existing basket tokens are redeemed to underlying tokens.
     */
    event Redeemed(address indexed sourceAddress, address indexed tokenAddress, uint256 amount, uint256 redemptionAmount);

    /**
     * @dev Two underlying tokens are swapped.
     */
    event Swapped(address indexed sourceAddress, address indexed inputToken, address indexed outputToken, uint256 inputAmount, uint256 outputAmount);

    address private _basketManagerAddress;
    address private _feeReceiverAddress;
    address private _basketTokenAddress;
    mapping(address => uint256) private _tokenBalances;

    /**
     * @dev Only BasketManager can call functions affected by this modifier.
     */
    modifier onlyBasketManager {
        require(msg.sender == _basketManagerAddress, "BasketCore: The caller must be BasketManager contract");
        _;
    }

    /**
     * @dev Initializes the BasketCore contract in proxy.
     * The caller will become the owner of the contract.
     */
    function initialize(address basketManagerAddress, address feeReceiverAddress, address basketTokenAddress) public initializer {
        require(basketManagerAddress != address(0x0), "BasketCore: Basket manager not set");
        require(feeReceiverAddress != address(0x0), "BasketCore: Fee receiver not set");
        require(basketTokenAddress != address(0x0), "BasketCore: Basket token not set");
        Ownable._initialize();
        _basketManagerAddress = basketManagerAddress;
        _feeReceiverAddress = feeReceiverAddress;
        _basketTokenAddress = basketTokenAddress;
    }

    /**
     * @dev Mints new basket token by depositing underlying token. For minting, if there is any mint fee,
     * it must be charged with the basket token.
     * @param sourceAddress The address of the user who mints new basket tokens.
     * @param tokenAddress The address of the underlying token deposited.
     * @param amount The amount of underlying asset deposited.
     * @param feeAmount The amount fee charged on minting.
     * @return The amount of basket token minted.
     */
    function mint(address sourceAddress, address tokenAddress, uint256 amount, uint256 feeAmount) public onlyBasketManager returns (uint256) {
        require(sourceAddress != address(0x0), "BasketCore: Source address is not set");
        require(tokenAddress != address(0x0), "BasketCore: Token address is not set");
        require(amount > 0, "BasketCore: Amount is not set");

        _safeTransferIn(sourceAddress, tokenAddress, amount);
        _tokenBalances[tokenAddress] = _tokenBalances[tokenAddress].add(amount);

        uint256 mintAmount = amount.sub(feeAmount);
        if (feeAmount > 0) {
            // If there is any minting fee, it must be charged using basket token.
            // The fee amount is used to mint basket token and send to fee receiver.
            BasketToken(_basketTokenAddress).mint(_feeReceiverAddress, feeAmount);
            IFeeReceiver(_feeReceiverAddress).onFeeReceived(_basketTokenAddress, feeAmount);
        }
        // Mints the mint amount of basket token to maintain the invariant.
        BasketToken(_basketTokenAddress).mint(sourceAddress, mintAmount);
        emit Minted(sourceAddress, tokenAddress, amount, mintAmount);

        return mintAmount;
    }

    /**
     * @dev Redeems basket tokens and withdraws the underlying token. For redemption, if there is any redemption fee,
     * it must be charged with the basket token.
     * @param sourceAddress The address of the user who redeems existing basket tokens.
     * @param tokenAddress The address of the underlying asset to withdraw.
     * @param amount The amount of basket token to redeem.
     * @param feeAmount The amount of fee charged on redemption.
     * @return The amount of underlying asset withdrawn.
     */
    function redeem(address sourceAddress, address tokenAddress, uint256 amount, uint256 feeAmount) public onlyBasketManager returns (uint256) {
        require(sourceAddress != address(0x0), "BasketCore: Source address is not set");
        require(tokenAddress != address(0x0), "BasketCore: Token address is not set");
        require(amount > 0, "BasketCore: Amount is not set");

        uint256 redemptionAmount = amount.sub(feeAmount);
        require(_tokenBalances[tokenAddress] >= redemptionAmount, "BasketCore: Insufficient token balance");

        _tokenBalances[tokenAddress] = _tokenBalances[tokenAddress].sub(redemptionAmount);

        _safeTransferIn(sourceAddress, _basketTokenAddress, amount);
        if (feeAmount > 0) {
            // If there is any redemption fee, it must be charged using the basket token.
            // The fee amount is sent to the fee receiver.
            BasketToken(_basketTokenAddress).transfer(_feeReceiverAddress, feeAmount);
            IFeeReceiver(_feeReceiverAddress).onFeeReceived(_basketTokenAddress, feeAmount);
        }
        IERC20(tokenAddress).safeTransfer(sourceAddress, redemptionAmount);
        // Burns the redemption amount of basket token to maintain the invariant.
        BasketToken(_basketTokenAddress).burn(address(this), redemptionAmount);
        emit Redeemed(sourceAddress, tokenAddress, amount, redemptionAmount);

        return redemptionAmount;
    }

    /**
     * @dev Swaps two underlying assets. The swap fee can be charged in either input token or output token. If there is
     * any fee charged in the swap, it must be charged with the basket token.
     * @param sourceAddress The address of the user who swaps underlying assets.
     * @param inputToken The address of the input token.
     * @param outputToken The address of the output token.
     * @param amount The amount of input token to swap in.
     * @param feeAmount The amount of fee charged in the swap.
     * @return The amount of output token swap out.
     */
    function swap(address sourceAddress, address inputToken, address outputToken, uint256 amount, uint256 feeAmount) public onlyBasketManager returns (uint256) {
        require(sourceAddress != address(0x0), "BasketCore: Source address is not set");
        require(inputToken != address(0x0), "BasketCore: Input token is not set");
        require(outputToken != address(0x0), "BasketCore: Output token is not set");
        require(amount > 0, "BasketCore: Amount is not set");

        uint256 outputAmount = amount.sub(feeAmount);
        require(_tokenBalances[outputToken] >= outputAmount, "BasketCore: Insufficient output balance");

        _tokenBalances[inputToken] = _tokenBalances[inputToken].add(amount);
        _tokenBalances[outputToken] = _tokenBalances[outputToken].sub(outputAmount);

        _safeTransferIn(sourceAddress, inputToken, amount);
        if (feeAmount > 0) {
            // If there is any swap fee charged, it must be charged with basket token.
            // The fee amount is used to mint basket token and send to the fee receiver.
            BasketToken(_basketTokenAddress).mint(_feeReceiverAddress, feeAmount);
            IFeeReceiver(_feeReceiverAddress).onFeeReceived(_basketTokenAddress, feeAmount);
        }
        IERC20(outputToken).safeTransfer(sourceAddress, outputAmount);
        emit Swapped(sourceAddress, inputToken, outputToken, amount, outputAmount);

        return outputAmount;
    }

    /**
     * @dev Updates the BasketManager contract.
     */
    function setBasketManager(address basketManagerAddress) public onlyOwner {
        require(basketManagerAddress != address(0x0), "BasketCore: Basket manager not set");
        _basketManagerAddress = basketManagerAddress;
    }

    /**
     * @dev Retrieves the BasketManager contract address.
     */
    function getBasketManager() public view returns (address) {
        return _basketManagerAddress;
    }

    /**
     * @dev Updates the fee receiver contract.
     */
    function setFeeReceiver(address feeReceiverAddress) public onlyOwner {
        require(feeReceiverAddress != address(0x0), "BasketCore: Fee receiver not set");
        _feeReceiverAddress = feeReceiverAddress;
    }

    /**
     * @dev Retrieves the fee receiver contract address.
     */
    function getFeeReceiver() public view returns (address) {
        return _feeReceiverAddress;
    }

    /**
     * @dev Updates the basket token contract.
     */
    function setBasketToken(address basketTokenAddress) public onlyOwner {
        require(basketTokenAddress != address(0x0), "BasketCore: Basket token not set");
        _basketTokenAddress = basketTokenAddress;
    }    

    /**
     * @dev Retrieves the BasketToken contract address.
     */
    function getBasketToken() public view returns (address) {
        return _basketTokenAddress;
    }

    /**
     * @dev Returns the current balance of the underlying asset.
     */
    function getTokenBalance(address tokenAddress) public view returns (uint256) {
        return _tokenBalances[tokenAddress];
    }

    /**
     * @dev Safely transfer token from source address.
     */
    function _safeTransferIn(address sourceAddress, address tokenAddress, uint256 amount) internal {
        uint256 prevBalance = IERC20(tokenAddress).balanceOf(address(this));
        IERC20(tokenAddress).safeTransferFrom(sourceAddress, address(this), amount);
        uint256 currBalance = IERC20(tokenAddress).balanceOf(address(this));
        require(prevBalance.add(amount) == currBalance, "BasketCore: Incorrect transfer amount");
    }
}