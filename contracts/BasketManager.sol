// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./BasketCore.sol";
import "./Ownable.sol";
import "./ReentrancyGuard.sol";

/**
 * @notice The basket manager contract which interacts with basket core to mint and redeem basket tokens.
 */
contract BasketManager is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    /**
     * @dev Status of individual underlying asset in the basket.
     */
    enum AssetStatus {
        Invalid,
        Normal,             // Can increase asset balance.
        Paused,             // Can't increase asset balance. Can change back to Normal.
        Terminated          // Can't increase asset balance. Can't change to other status.
    }

    /**
     * @dev Data about underlying asset in the basket.
     */
    struct Asset {
        AssetStatus status;
        uint256 index;
    }

    address private _basketCoreAddress;
    address[] private _tokenAddresses;
    mapping(address => Asset) _tokens;

    /**
     * @dev Initializes the contract in the proxy.
     */
    function initialize(address basketCoreAddress) public {
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
    function addAsset(address tokenAddress) public onlyOwner {
        require(_tokens[tokenAddress].status == AssetStatus.Invalid, "BasketManager: Asset already exist");
        _tokenAddresses.push(tokenAddress);
        _tokens[tokenAddress].status = AssetStatus.Normal;
        _tokens[tokenAddress].index = _tokenAddresses.length - 1;
    }

    /**
     * @dev Pause the underlying asset. It's balance cannot increase in the BasketCore.
     */
    function pauseAsset(address tokenAddress) public onlyOwner {
        require(_tokens[tokenAddress].status == AssetStatus.Normal, "BasketManager: Invalid asset status");
        _tokens[tokenAddress].status = AssetStatus.Paused;
    }

    /**
     * @dev Unpause the underlying asset. It's balance can increase in the BasketCore.
     */
    function unpauseAsset(address tokenAddress) public onlyOwner {
        require(_tokens[tokenAddress].status == AssetStatus.Paused, "BasketManager: Invalid asset status");
        _tokens[tokenAddress].status = AssetStatus.Normal;
    }

    /**
     * @dev Terminates an asset. It's balance can increase in the BasketCore, and it's a final status.
     */
    function terminateAsset(address tokenAddress) public onlyOwner {
        require(_tokens[tokenAddress].status == AssetStatus.Normal || _tokens[tokenAddress].status == AssetStatus.Paused,
            "BasketManager: Invalid asset status");
        _tokens[tokenAddress].status = AssetStatus.Terminated;
    }

    /**
     * @dev Retrieves the BasketCore contract address.
     */
    function getBasketCore() public view returns (address) {
        return _basketCoreAddress;
    }

    /**
     * @dev Mints new basket token with underlying tokens.
     * @param tokenAddresses The addresses of the underlying assets deposited.
     * @param amounts The amounts of underlying assets deposited.
     * @return The amount of basket token minted.
     */
    function mint(address[] memory tokenAddresses, uint256[] memory amounts) public nonReentrant returns (uint256) {
        require(tokenAddresses.length == amounts.length, "BasketManager: Token length mismatch");
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            // If an asset is paused or terminated, it cannot be used to mint new basket token.
            require(_tokens[tokenAddresses[i]].status == AssetStatus.Normal, "BasketManager: Invalid asset status");
            require(amounts[i] > 0, "BasketManager: Zero deposit amount");
        }

        uint256 mintAmount = 0;
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            // No mint fee.
            mintAmount = mintAmount.add(BasketCore(_basketCoreAddress).mint(msg.sender, tokenAddresses[i], amounts[i], 0));
        }

        return mintAmount;
    }

    /**
     * @dev Proportionally redeem the basket token.
     * @param amount The amount of basket token to redeem.
     * @return tokenAddresses The underlying assets and their amounts withdrawn.
     */
    function redeem(uint256 amount) public nonReentrant returns (address[] memory tokenAddresses, uint256[] memory amounts) {
        require(amount > 0, "BasketManager: Zero redemption amount");
        uint256 tokenTotalBalance = 0;
        uint256[] memory tokenBalances = new uint256[](_tokenAddresses.length);
        for (uint256 i = 0; i < _tokenAddresses.length; i++) {
            tokenBalances[i] = BasketCore(_basketCoreAddress).getTokenBalance(tokenAddresses[i]);
            tokenTotalBalance = tokenTotalBalance.add(tokenBalances[i]);
        }
        require(tokenTotalBalance > amount, "BasketManager: Insufficient redemption token");

        tokenAddresses = _tokenAddresses;
        amounts = new uint256[](_tokenAddresses.length);
        for (uint256 i = 0; i < _tokenAddresses.length; i++) {
            uint256 redemptionAmount = amount.mul(tokenBalances[i]).div(tokenTotalBalance);
            // No redemption fee for proportionally redemption
            amounts[i] = BasketCore(_basketCoreAddress).redeem(msg.sender, tokenAddresses[i], redemptionAmount, 0);
        }
    }
}