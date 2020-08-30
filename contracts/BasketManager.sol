// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BasketCore.sol";
import "./Initializable.sol";
import "./Ownable.sol";
import "./ReentrancyGuard.sol";

/**
 * @notice The basket manager contract which interacts with basket core to mint and redeem basket tokens.
 */
contract BasketManager is Ownable, Initializable, ReentrancyGuard {
    using SafeMath for uint256;

    /**
     * @dev Status of individual underlying token in the basket.
     */
    enum TokenStatus {
        Invalid,
        Normal,             // Can increase token balance.
        Paused,             // Can't increase token balance. Can change back to Normal.
        Terminated          // Can't increase token balance. Can't change to other status.
    }

    /**
     * @dev Data about underlying token in the basket.
     */
    struct Token {
        TokenStatus status;
        uint256 index;
    }

    address private _basketCoreAddress;
    address[] private _tokenAddresses;
    mapping(address => Token) _tokens;

    /**
     * @dev Initializes the contract in the proxy.
     */
    function initialize(address basketCoreAddress) public initializer {
        require(basketCoreAddress != address(0x0), "BasketManager: Basket core address not set.");

        _initialize();
        _basketCoreAddress = basketCoreAddress;
    }

    function _initialize() internal override(Ownable, ReentrancyGuard) {
        Ownable._initialize();
        ReentrancyGuard._initialize();
    }

    /**
     * @dev Adds a new underlying token to the basket.
     */
    function addToken(address tokenAddress) public onlyOwner {
        require(_tokens[tokenAddress].status == TokenStatus.Invalid, "BasketManager: Token already exist");
        _tokenAddresses.push(tokenAddress);
        _tokens[tokenAddress].status = TokenStatus.Normal;
        _tokens[tokenAddress].index = _tokenAddresses.length - 1;
    }

    /**
     * @dev Pause the underlying token. It's balance cannot increase in the BasketCore.
     */
    function pauseToken(address tokenAddress) public onlyOwner {
        require(_tokens[tokenAddress].status == TokenStatus.Normal, "BasketManager: Invalid token status");
        _tokens[tokenAddress].status = TokenStatus.Paused;
    }

    /**
     * @dev Unpause the underlying token. It's balance can increase in the BasketCore.
     */
    function unpauseToken(address tokenAddress) public onlyOwner {
        require(_tokens[tokenAddress].status == TokenStatus.Paused, "BasketManager: Invalid token status");
        _tokens[tokenAddress].status = TokenStatus.Normal;
    }

    /**
     * @dev Terminates an token. It's balance can increase in the BasketCore, and it's a final status.
     */
    function terminateToken(address tokenAddress) public onlyOwner {
        require(_tokens[tokenAddress].status == TokenStatus.Normal || _tokens[tokenAddress].status == TokenStatus.Paused,
            "BasketManager: Invalid token status");
        _tokens[tokenAddress].status = TokenStatus.Terminated;
    }

    /**
     * @dev Updates the BasketCore contract address.
     */
    function setBasketCore(address basketCoreAddress) public {
        require(basketCoreAddress != address(0x0), "BasketManager: Basket core address not set.");
        _basketCoreAddress = basketCoreAddress;
    }

    /**
     * @dev Retrieves the BasketCore contract address.
     */
    function getBasketCore() public view returns (address) {
        return _basketCoreAddress;
    }

    /**
     * @dev Retrives all underlying tokens in the BasketManager.
     */
    function getTokens() public view returns (address[] memory) {
        return _tokenAddresses;
    }

    /**
     * @dev Retrieves the status of an underlying token in the basket.
     */
    function getTokenStatus(address tokenAddress) public view returns (TokenStatus) {
        return _tokens[tokenAddress].status;
    }

    /**
     * @dev Mints new basket token with underlying tokens.
     * @param tokenAddresses The addresses of the underlying tokens deposited.
     * @param amounts The amounts of underlying tokens deposited.
     * @return The amount of basket token minted.
     */
    function mint(address[] memory tokenAddresses, uint256[] memory amounts) public nonReentrant returns (uint256) {
        require(tokenAddresses.length == amounts.length, "BasketManager: Token length mismatch");
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            // If an token is paused or terminated, it cannot be used to mint new basket token.
            require(_tokens[tokenAddresses[i]].status == TokenStatus.Normal, "BasketManager: Invalid token status");
            require(amounts[i] > 0, "BasketManager: Zero deposit amount");
        }

        uint256 mintAmount = 0;
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            // No mint fee in the current version.
            // This might change in the future by upgrading the BasketManager.
            mintAmount = mintAmount.add(BasketCore(_basketCoreAddress).mint(msg.sender, tokenAddresses[i], amounts[i], 0));
        }

        return mintAmount;
    }

    /**
     * @dev Proportionally redeem the basket token.
     * @param amount The amount of basket token to redeem.
     * @return tokenAddresses The underlying tokens and their amounts withdrawn.
     */
    function redeem(uint256 amount) public nonReentrant returns (address[] memory tokenAddresses, uint256[] memory amounts) {
        require(amount > 0, "BasketManager: Zero redemption amount");
        address basketTokenAddress = BasketCore(_basketCoreAddress).getBasketToken();

        // Since BasketCore enforces the following:
        //      Sum of all token balances = Total supply of basket token
        // We could use the total supply of basket token as the total balance of all underlying tokens!
        uint256 totalBalance = IERC20(basketTokenAddress).totalSupply();
        require(totalBalance > amount, "BasketManager: Insufficient total balance");

        tokenAddresses = _tokenAddresses;
        amounts = new uint256[](_tokenAddresses.length);
        for (uint256 i = 0; i < _tokenAddresses.length; i++) {
            uint256 tokenBalance = BasketCore(_basketCoreAddress).getTokenBalance(_tokenAddresses[i]);
            uint256 redemptionAmount = amount.mul(tokenBalance).div(totalBalance);
            if (redemptionAmount == 0)  continue;
            // No redemption fee for proportionally redemption in the current version.
            // This might change in the future by upgrading BasketManager.
            amounts[i] = BasketCore(_basketCoreAddress).redeem(msg.sender, _tokenAddresses[i], redemptionAmount, 0);
        }
    }

    /**
     * @dev Computes the redemption amounts for proportional redemption. Read-only version of redeem() method.
     * @param amount The amount of basket token to redeem.
     * @return tokenAddresses The underlying tokens and their amounts withdrawn.
     */
    function getRedemptionAmounts(uint256 amount) public view returns (address[] memory tokenAddresses, uint256[] memory amounts) {
        require(amount > 0, "BasketManager: Zero redemption amount");
        address basketTokenAddress = BasketCore(_basketCoreAddress).getBasketToken();

        // Since BasketCore enforces the following:
        //      Sum of all token balances = Total supply of basket token
        // We could use the total supply of basket token as the total balance of all underlying tokens!
        uint256 totalBalance = IERC20(basketTokenAddress).totalSupply();
        require(totalBalance > amount, "BasketManager: Insufficient total balance");

        tokenAddresses = _tokenAddresses;
        amounts = new uint256[](_tokenAddresses.length);
        for (uint256 i = 0; i < _tokenAddresses.length; i++) {
            uint256 tokenBalance = BasketCore(_basketCoreAddress).getTokenBalance(_tokenAddresses[i]);
            amounts[i] = amount.mul(tokenBalance).div(totalBalance);
        }
    }
}