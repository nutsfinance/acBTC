// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "./IPoolToken.sol";

/**
 * @notice ACoconut swap.
 */
contract ACoconutSwap {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /**
     * @dev Token exchanged between two underlying tokens.
     */
    event TokenExchanged(address indexed buyer, address indexed tokenSold, address indexed tokenBought, uint256 amountSold, uint256 amountBought, uint256 fee);
    /**
     * @dev New pool token is minted.
     */
    event Minted(address indexed provider, uint256[] amounts, uint256 oldSupply, uint256 newSupply, uint256 fee);
    /**
     * @dev Pool token is redeemed.
     */
    event Redeemed(address indexed provider, uint256[] amounts, uint256 oldSupply, uint256 newSupply, uint256 fee);

    uint256 public constant feeDenominator = 10 ** 10;
    address[] public coins;
    uint256[] public balances;
    uint256 public fee;     // Mint/Swap fee * 10**10
    uint256 public redemptionFee; // Redemption fee * 10**10
    address public feeReceiver;
    address public governance;
    address public poolToken;

    uint256 public initialA;
    uint256 public futureA;
    uint256 public initialATimestamp;
    uint256 public futureATimestamp;

    bool public paused;
    bool public terminated;

    constructor(address[] memory _coins, address _poolToken, address _feeReceiver, uint256 _A, uint256 _fee, uint256 _redemptionFee) public {
        for (uint256 i = 0; i < _coins.length; i++) {
            require(_coins[i] != address(0x0), "ACoconutSwap: token not set");
            balances.push(0);
        }
        require(_poolToken != address(0x0), "ACoconutSwap: pool token not set");
        require(_feeReceiver != address(0x0), "ACoconutSwap: fee receiver not set");
        coins = _coins;
        poolToken = _poolToken;
        feeReceiver = _feeReceiver;
        initialA = _A;
        futureA = _A;
        fee = _fee;
        redemptionFee = _redemptionFee;
    }

    /**
     * @dev Handles ramping up or down of A
     */
    function getA() public view returns (uint256) {
        uint256 t1 = futureATimestamp;
        uint256 a1 = futureA;

        if (block.timestamp < t1) {
            uint256 t0 = initialATimestamp;
            uint256 a0 = initialA;

            if (a1 > a0) {
                // a0 + (a1 - a0) * (block.timestamp - t0) / (t1 - t0)
                return a0.add(a1.sub(a0).mul(block.timestamp.sub(t0)).div(t1.sub(t0)));
            } else {
                // a0 - (a0 - a1) * (block.timestamp - t0) / (t1 - t0)
                return a0.sub(a0.sub(a1).mul(block.timestamp.sub(t0)).div(t1.sub(t0)));
            }
        } else {
            return a1;
        }
    }

    /**
     * @dev Computes D given token balances and amplification coefficient.
     */
    function _getD(uint256[] memory _balances, uint256 _A) internal pure returns (uint256) {
        uint256 sum = 0;
        uint256 i = 0;
        for (i = 0; i < _balances.length; i++) {
            sum = sum.add(_balances[i]);
        }
        if (sum == 0)   return 0;

        uint256 prevD = 0;
        uint256 D = sum;
        uint256 Ann = _A * _balances.length;
        for (i = 0; i < 255; i++) {
            uint256 pD = D;
            for (i = 0; i < _balances.length; i++) {
                pD = pD.mul(D).div(_balances[i].mul(_balances.length));
            }
            prevD = D;
            D = Ann.mul(sum).add(pD.mul(_balances.length)).mul(D).div(Ann.sub(1).mul(D).add(_balances.length.add(1).mul(pD)));
            if (D > prevD) {
                if (D - prevD <= 1) break;
            } else {
                if (prevD - D <= 1) break;
            }
        }

        return D;
    }

    function getMintAmount(uint256[] memory amounts) public view returns (uint256) {
        require(amounts.length == balances.length, "ACoconutSwap: length not match");
        uint256[] memory _balances = balances;
        uint256 A = getA();
        uint256 oldD = _getD(_balances, A);
        for (uint256 i = 0; i < _balances.length; i++) {
            _balances[i] = _balances[i].add(amounts[i]);
        }
        uint256 newD = _getD(_balances, A);

        return newD.sub(oldD);
    }

    function getRedemptionAmount(uint256[] memory amounts) public view returns (uint256) {
        require(amounts.length == balances.length, "ACoconutSwap: length not match");
        uint256[] memory _balances = balances;
        uint256 A = getA();
        uint256 oldD = _getD(_balances, A);
        for (uint256 i = 0; i < _balances.length; i++) {
            _balances[i] = _balances[i].sub(amounts[i]);
        }
        uint256 newD = _getD(_balances, A);

        return oldD.sub(newD);
    }

    function mint(uint256[] memory amounts) public returns (uint256) {
        require(!paused && !terminated, "ACoconutSwap: paused");
        uint256 A = getA();
        uint256[] memory _balances = balances;
        uint256 oldD = _getD(_balances, A);
        uint256 i = 0;

        for (i = 0; i < _balances.length; i++) {
            if (oldD == 0) {
                // Initial deposit rquires all tokens provided!
                require(amounts[i] > 0, "ACoconutSwap: zero amount");
                _balances[i] = _balances[i].add(amounts[i]);
            }
        }
        uint256 newD = _getD(_balances, A);
        uint256 mintAmount = newD.sub(oldD);
        uint256 feeAmount;
        if (fee > 0) {
            feeAmount = mintAmount.mul(fee).div(feeDenominator);
            IPoolToken(poolToken).mint(feeReceiver, feeAmount);
            mintAmount = mintAmount.sub(feeAmount);
        }
        IPoolToken(poolToken).mint(msg.sender, mintAmount);

        // Transfer tokens into the swap
        for (i = 0; i < amounts.length; i++) {
            if (amounts[i] == 0)    continue;
            IERC20(coins[i]).safeTransferFrom(msg.sender, address(this), amounts[i]);
        }

        emit Minted(msg.sender, amounts, oldD, newD, feeAmount);

        return mintAmount;
    }
}