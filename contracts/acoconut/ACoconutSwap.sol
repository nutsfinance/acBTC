// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "../libraries/upgradeability/Initializable.sol";
import "./IPoolToken.sol";

/**
 * @notice ACoconut swap.
 */
contract ACoconutSwap is Initializable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /**
     * @dev Token swapped between two underlying tokens.
     */
    event TokenSwapped(address indexed buyer, address indexed tokenSold, address indexed tokenBought, uint256 amountSold, uint256 amountBought);
    /**
     * @dev New pool token is minted.
     */
    event Minted(address indexed provider, uint256 mintAmount, uint256[] amounts, uint256 feeAmount);
    /**
     * @dev Pool token is redeemed.
     */
    event Redeemed(address indexed provider, uint256 redeemAmount, uint256[] amounts, uint256 feeAmount);
    /**
     * @dev Fee is collected.
     */
    event FeeCollected(address indexed feeRecipient, uint256 feeAmount);

    uint256 public constant feeDenominator = 10 ** 10;
    address[] public tokens;
    uint256[] public precisions; // 10 ** (18 - token decimals)
    uint256[] public balances; // Converted to 10 ** 18
    uint256 public mintFee; // Mint fee * 10**10
    uint256 public swapFee; // Swap fee * 10**10
    uint256 public redeemFee; // Redeem fee * 10**10
    address public feeRecipient;
    address public poolToken;

    uint256 public initialA;
    uint256 public futureA;
    uint256 public initialATimestamp;
    uint256 public futureATimestamp;

    address public governance;
    mapping(address => bool) public admins;
    bool public paused;

    function initialize(address[] memory _tokens, uint256[] memory _precisions, uint256[] memory _fees,
        address _poolToken, address _feeRecipient, uint256 _A) public initializer {
        require(_tokens.length == _precisions.length, "input mismatch");
        require(_fees.length == 3, "no fees");
        for (uint256 i = 0; i < _tokens.length; i++) {
            require(_tokens[i] != address(0x0), "token not set");
            require(_precisions[i] != 0, "precision not set");
            balances.push(0);
        }
        require(_poolToken != address(0x0), "pool token not set");
        require(_feeRecipient != address(0x0), "fee receiver not set");

        governance = msg.sender;
        tokens = _tokens;
        poolToken = _poolToken;
        feeRecipient = _feeRecipient;
        initialA = _A;
        futureA = _A;
        mintFee = _fees[0];
        swapFee = _fees[1];
        redeemFee = _fees[2];

        // The swap must start with paused state!
        paused = true;
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
     * @dev Computes D given token balances.
     * @param _balances Normalized balance of each token.
     * @param _A Amplification coefficient from getA()
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

    /**
     * @dev Computes token balance given D.
     * @param _balances Converted balance of each token except token with index _j.
     * @param _j Index of the token to calculate balance.
     * @param _D The target D value.
     * @param _A Amplification coeffient.
     * @return Converted balance of the token with index _j.
     */
    function _getY(uint256[] memory _balances, uint256 _j, uint256 _D, uint256 _A) internal pure returns (uint256) {
        uint256 c = _D;
        uint256 S_ = 0;
        uint256 Ann = _A * _balances.length;
        uint256 i = 0;
        for (i = 0; i < _balances.length; i++) {
            if (i == _j) continue;
            S_ = S_.add(_balances[i]);
            // c = c * D / (_x * N)
            c = c.mul(_D).div(_balances[i].mul(_balances.length));
        }
        // c = c * D / (Ann * N)
        c = c.mul(_D).div(Ann.mul(_balances.length));
        // b = S_ + D / Ann
        uint256 b = S_.add(_D.div(Ann));
        uint256 prevY = 0;
        uint256 y = _D;

        // 255 since the result is 256 digits
        for (i = 0; i < 255; i++) {
            prevY = y;
            // y = (y * y + c) / (2 * y + b - D)
            y = y.mul(y).add(c).div(y.mul(2).add(b).sub(_D));
            if (y > prevY) {
                if (y - prevY <= 1) break;
            } else {
                if (prevY - y <= 1) break;
            }
        }

        return y;
    }

    /**
     * @dev Compute the amount of pool token that can be minted.
     * @param _amounts Unconverted token balances.
     * @return The amount of pool token minted.
     */
    function getMintAmount(uint256[] calldata _amounts) external view returns (uint256) {
        uint256[] memory _balances = balances;
        require(_amounts.length == _balances.length, "invalid amount");
        
        uint256 A = getA();
        uint256 oldD = _getD(_balances, A);
        uint256 i = 0;
        for (i = 0; i < _balances.length; i++) {
            if (_amounts[i] == 0)   continue;
            // balance = balance + amount * precision
            _balances[i] = _balances[i].add(_amounts[i].mul(precisions[i]));
        }
        uint256 newD = _getD(_balances, A);
        // newD should be bigger than or equal to oldD
        uint256 mintAmount = newD.sub(oldD);

        if (mintFee > 0) {
            mintAmount = mintAmount.sub(mintAmount.mul(mintFee).div(feeDenominator));
        }

        return mintAmount;
    }

    /**
     * @dev Mints new pool token.
     * @param _amounts Unconverted token balances used to mint pool token.
     * @param _minMintAmount Minimum amount of pool token to mint.
     */
    function mint(uint256[] calldata _amounts, uint256 _minMintAmount) external nonReentrant {
        uint256[] memory _balances = balances;
        // If swap is paused, only admins can mint.
        require(!paused || admins[msg.sender], "paused");
        require(_balances.length == _amounts.length, "invalid amounts");

        uint256 A = getA();
        uint256 oldD = _getD(_balances, A);
        uint256 i = 0;
        for (i = 0; i < _balances.length; i++) {
            if (oldD == 0) {
                // Initial deposit rquires all tokens provided!
                require(_amounts[i] > 0, "zero amount");
            }
            _balances[i] = _balances[i].add(_amounts[i].mul(precisions[i]));
        }
        uint256 newD = _getD(_balances, A);
        // newD should be bigger than or equal to oldD
        uint256 mintAmount = newD.sub(oldD);

        uint256 fee = mintFee;
        uint256 feeAmount;
        if (fee > 0) {
            feeAmount = mintAmount.mul(fee).div(feeDenominator);
            mintAmount = mintAmount.sub(feeAmount);
        }
        require(mintAmount >= _minMintAmount, "fewer than expected");

        // Transfer tokens into the swap
        for (i = 0; i < _amounts.length; i++) {
            if (_amounts[i] == 0)    continue;
            // Update the balance in storage
            balances[i] = _balances[i];
            IERC20(tokens[i]).safeTransferFrom(msg.sender, address(this), _amounts[i]);
        }
        IPoolToken(poolToken).mint(feeRecipient, feeAmount);
        IPoolToken(poolToken).mint(msg.sender, mintAmount);

        emit Minted(msg.sender, mintAmount, _amounts, feeAmount);
    }

    /**
     * @dev Computes the output amount after the swap.
     * @param _i Token index to swap in.
     * @param _j Token index to swap out.
     * @param _dx Unconverted amount of token _i to swap in.
     * @return Unconverted amount of token _j to swap out.
     */
    function getExchangeAmount(uint256 _i, uint256 _j, uint256 _dx) external view returns (uint256) {
        uint256[] memory _balances = balances;
        require(_i != _j, "same token");
        require(_i < _balances.length, "invalid in");
        require(_j < _balances.length, "invalid out");
        require(_dx > 0, "invalid amount");

        uint256 A = getA();
        uint256 D = _getD(_balances, A);
        // balance[i] = balance[i] + dx * precisions[i]
        _balances[_i] = _balances[_i].add(_dx.mul(precisions[_i]));
        uint256 y = _getY(_balances, _j, D, A);
        // dy = (balance[j] - y - 1) / precisions[j] in case there was rounding errors
        uint256 dy = _balances[_j].sub(y).sub(1).div(precisions[_j]);

        if (swapFee > 0) {
            dy = dy.sub(dy.mul(swapFee).div(feeDenominator));
        }

        return dy;
    }

    /**
     * @dev Exchange between two underlying tokens.
     * @param _i Token index to swap in.
     * @param _j Token index to swap out.
     * @param _dx Unconverted amount of token _i to swap in.
     * @param _minDy Minimum token _j to swap out in converted balance.
     */
    function swap(uint256 _i, uint256 _j, uint256 _dx, uint256 _minDy) external nonReentrant {
        uint256[] memory _balances = balances;
        // If swap is paused, only admins can swap.
        require(!paused || admins[msg.sender], "paused");
        require(_i != _j, "same token");
        require(_i < _balances.length, "invalid in");
        require(_j < _balances.length, "invalid out");
        require(_dx > 0, "invalid amount");

        uint256 A = getA();
        uint256 D = _getD(_balances, A);
        // balance[i] = balance[i] + dx * precisions[i]
        _balances[_i] = _balances[_i].add(_dx.mul(precisions[_i]));
        uint256 y = _getY(_balances, _j, D, A);
        // dy = (balance[j] - y - 1) / precisions[j] in case there was rounding errors
        uint256 dy = _balances[_j].sub(y).sub(1).div(precisions[_j]);
        // Update token balance in storage
        balances[_j] = y;

        uint256 fee = swapFee;
        if (fee > 0) {
            dy = dy.sub(dy.mul(fee).div(feeDenominator));
        }
        require(dy >= _minDy, "fewer than expected");
        // Important: When swap fee > 0, the swap fee is charged on the output token.
        // Therefore, balances[j] < tokens[j].balanceOf(this)
        // Since balances[j] is used to compute D, D is unchanged.
        // collectFees() is used to convert the difference between balances[j] and tokens[j].balanceOf(this)
        // into pool token as fees!
        IERC20(tokens[_j]).safeTransfer(msg.sender, dy);

        emit TokenSwapped(msg.sender, tokens[_i], tokens[_j], _dx, dy);
    }

    /**
     * @dev Computes the amounts of underlying tokens when redeeming pool token.
     * @param _amount Amount of pool tokens to redeem.
     * @return Amounts of underlying tokens redeemed.
     */
    function getRedeemAmount(uint256 _amount) external view returns (uint256[] memory) {
        uint256[] memory _balances = balances;
        require(_amount > 0, "zero amount");

        uint256 A = getA();
        uint256 D = _getD(_balances, A);
        uint256[] memory amounts = new uint256[](_balances.length);
        if (redeemFee > 0) {
            // Redemption fee is charged with pool token before redemption.
            _amount = _amount.sub(_amount.mul(redeemFee).div(feeDenominator));
        }

        for (uint256 i = 0; i < _balances.length; i++) {
            // We might choose to use poolToken.totalSupply to compute the amount, but decide to use
            // D in case we have multiple minters on the pool token.
            amounts[i] = _balances[i].mul(_amount).div(D);
        }

        return amounts;
    }

    /**
     * @dev Redeems pool token to underlying tokens proportionally.
     * @param _amount Amount of pool token to redeem.
     * @param _minRedeemAmounts Minimum amount of underlying tokens to get.
     */
    function redeem(uint256 _amount, uint256[] calldata _minRedeemAmounts) external nonReentrant {
        uint256[] memory _balances = balances;
        // If swap is paused, only admins can redeem.
        require(!paused || admins[msg.sender], "paused");
        require(_amount > 0, "zero amount");
        require(_balances.length == _minRedeemAmounts.length, "invalid mins");

        uint256 A = getA();
        uint256 D = _getD(_balances, A);
        uint256[] memory amounts = new uint256[](_balances.length);
        uint256 fee = redeemFee;
        uint256 feeAmount;
        if (fee > 0) {
            feeAmount = _amount.mul(fee).div(feeDenominator);
            // Redemption fee is paid with pool token
            // No conversion is needed as the pool token has 18 decimals
            IERC20(poolToken).safeTransferFrom(msg.sender, feeRecipient, feeAmount);
            _amount = _amount.sub(feeAmount);
        }

        for (uint256 i = 0; i < _balances.length; i++) {
            // We might choose to use poolToken.totalSupply to compute the amount, but decide to use
            // D in case we have multiple minters on the pool token.
            uint256 tokenAmount = _balances[i].mul(_amount).div(D);
            // Important: Underlying tokens must convert back to original decimals!
            amounts[i] = tokenAmount.div(precisions[i]);
            require(amounts[i] >= _minRedeemAmounts[i], "fewer than expected");
            // Updates the balance in storage
            balances[i] = _balances[i].sub(tokenAmount);
            IERC20(tokens[i]).safeTransfer(msg.sender, amounts[i]);
        }

        IPoolToken(poolToken).burn(msg.sender, _amount);

        emit Redeemed(msg.sender, _amount.add(feeAmount), amounts, feeAmount);
    }

    /**
     * @dev Computes the amount when redeeming pool token to one specific underlying token.
     * @param _amount Amount of pool token to redeem.
     * @param _i Index of the underlying token to redeem to.
     * @return Amount of underlying token that can be redeem to.
     */
    function getRedeemAmount(uint256 _amount, uint256 _i) external view returns (uint256) {
        uint256[] memory _balances = balances;
        require(_amount > 0, "zero amount");
        require(_i < _balances.length, "invalid token");

        uint256 A = getA();
        uint256 D = _getD(_balances, A);
        if (redeemFee > 0) {
            // Redemption fee is charged with pool token before redemption.
            _amount = _amount.sub(_amount.mul(redeemFee).div(feeDenominator));
        }
        uint256 y = _getY(_balances, _i, D.sub(_amount), A);

        return _balances[_i].sub(y).div(precisions[_i]);
    }

    /**
     * @dev Redeem pool token to one specific underlying token.
     * @param _amount Amount of pool token to redeem.
     * @param _i Index of the token to redeem to.
     * @param _minRedeemAmount Minimum amount of the underlying token to redeem to.
     */
    function redeem(uint256 _amount, uint256 _i, uint256 _minRedeemAmount) external nonReentrant {
        uint256[] memory _balances = balances;
        // If swap is paused, only admins can redeem.
        require(!paused || admins[msg.sender], "paused");
        require(_amount > 0, "zero amount");
        require(_i < _balances.length, "invalid token");

        uint256 A = getA();
        uint256 D = _getD(_balances, A);
        uint256 fee = redeemFee;
        uint256 feeAmount = 0;
        if (fee > 0) {
            // Redemption fee is charged with pool token before redemption.
            feeAmount = _amount.mul(fee).div(feeDenominator);
            // No conversion is needed as the pool token has 18 decimals
            IERC20(poolToken).safeTransferFrom(msg.sender, feeRecipient, feeAmount);
            _amount = _amount.sub(feeAmount);
        }

        uint256 y = _getY(_balances, _i, D.sub(_amount), A);
        uint256 dy = _balances[_i].sub(y).div(precisions[_i]);
        require(dy >= _minRedeemAmount, "fewer than expected");
        // Updates token balance in storage
        balances[_i] = y;
        uint256[] memory amounts = new uint256[](_balances.length);
        amounts[_i] = dy;

        IERC20(tokens[_i]).safeTransfer(msg.sender, dy);
        IPoolToken(poolToken).burn(msg.sender, _amount.add(feeAmount));

        emit Redeemed(msg.sender, _amount.add(feeAmount), amounts, feeAmount);
    }

    /**
     * @dev Compute the amount of pool token that needs to be redeemed.
     * @param _amounts Unconverted token balances.
     * @return The amount of pool token that needs to be redeemed.
     */
    function getRedeemTokensAmount(uint256[] calldata _amounts) external view returns (uint256) {
        uint256[] memory _balances = balances;
        require(_amounts.length == balances.length, "length not match");
        
        uint256 A = getA();
        uint256 oldD = _getD(_balances, A);
        for (uint256 i = 0; i < _balances.length; i++) {
            if (_amounts[i] == 0)   continue;
            // balance = balance + amount * precision
            _balances[i] = _balances[i].sub(_amounts[i].mul(precisions[i]));
        }
        uint256 newD = _getD(_balances, A);

        // newD should be smaller than or equal to oldD
        uint256 redeemAmount = oldD.sub(newD);
        if (redeemFee > 0) {
            redeemAmount = redeemAmount.mul(feeDenominator).div(feeDenominator.sub(redeemFee));
        }

        return redeemAmount;
    }

    /**
     * @dev Redeems underlying tokens.
     * @param _amounts Amounts of underlying tokens to redeem to.
     * @param _maxRedeemAmount Maximum of pool token to redeem.
     */
    function redeemTokens(uint256[] calldata _amounts, uint256 _maxRedeemAmount) external nonReentrant {
        uint256[] memory _balances = balances;
        require(_amounts.length == balances.length, "length not match");
        // If swap is paused, only admins can redeem.
        require(!paused || admins[msg.sender], "paused");
        
        uint256 A = getA();
        uint256 oldD = _getD(_balances, A);
        uint256 i = 0;
        for (i = 0; i < _balances.length; i++) {
            if (_amounts[i] == 0)   continue;
            // balance = balance + amount * precision
            _balances[i] = _balances[i].sub(_amounts[i].mul(precisions[i]));
        }
        uint256 newD = _getD(_balances, A);

        // newD should be smaller than or equal to oldD
        uint256 redeemAmount = oldD.sub(newD);
        uint256 fee = redeemFee;
        uint256 feeAmount = 0;
        if (fee > 0) {
            redeemAmount = redeemAmount.mul(feeDenominator).div(feeDenominator.sub(fee));
            feeAmount = redeemAmount.sub(oldD.sub(newD));
            // No conversion is needed as the pool token has 18 decimals
            IERC20(poolToken).safeTransferFrom(msg.sender, feeRecipient, feeAmount);
        }
        require(redeemAmount <= _maxRedeemAmount, "more than expected");

        // Updates token balances in storage.
        balances = _balances;
        IPoolToken(poolToken).burn(msg.sender, redeemAmount);
        for (i = 0; i < _balances.length; i++) {
            if (_amounts[i] == 0)   continue;
            IERC20(tokens[i]).safeTransfer(msg.sender, _amounts[i]);
        }

        emit Redeemed(msg.sender, redeemAmount, _amounts, feeAmount);
    }

    /**
     * @dev Collect fee based on the token balance difference.
     */
    function collectFees() external returns (uint256) {
        require(msg.sender == feeRecipient, "not fee recipient");
        uint256[] memory _balances = balances;
        uint256 A = getA();
        uint256 oldD = _getD(_balances, A);

        for (uint256 i = 0; i < _balances.length; i++) {
            _balances[i] = IERC20(tokens[i]).balanceOf(address(this));
        }
        uint256 newD = _getD(_balances, A);
        uint256 feeAmount = newD.sub(oldD);
        if (feeAmount == 0) return 0;

        balances = _balances;
        address _feeRecipient = feeRecipient;
        IPoolToken(poolToken).mint(_feeRecipient, feeAmount);

        emit FeeCollected(_feeRecipient, feeAmount);

        return feeAmount;
    }

    /**
     * @dev Updates the govenance address.
     */
    function setGovernance(address _governance) external {
        require(msg.sender == governance, "not governance");
        governance = _governance;
    }

    /**
     * @dev Updates the mint fee.
     */
    function setMintFee(uint256 _mintFee) external {
        require(msg.sender == governance, "not governance");
        mintFee = _mintFee;
    }

    /**
     * @dev Updates the swap fee.
     */
    function setSwapFee(uint256 _swapFee) external {
        require(msg.sender == governance, "not governance");
        swapFee = _swapFee;
    }

    /**
     * @dev Updates the redeem fee.
     */
    function setRedeemFee(uint256 _redeemFee) external {
        require(msg.sender == governance, "not governance");
        redeemFee = _redeemFee;
    }

    /**
     * @dev Updates the recipient of mint/swap/redeem fees.
     */
    function setFeeRecipient(address _feeRecipient) external {
        require(msg.sender == governance, "not governance");
        require(_feeRecipient != address(0x0), "fee recipient not set");
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Updates the pool token.
     */
    function setPoolToken(address _poolToken) external {
        require(msg.sender == governance, "not governance");
        require(_poolToken != address(0x0), "pool token not set");
        poolToken = _poolToken;
    }

    /**
     * @dev Updates the amplicification coefficient.
     */
    function rampA(uint256 _futureA, uint256 _futureATimestamp) external {
        require(msg.sender == governance, "not governance");
        require(_futureATimestamp > block.timestamp, "too early");

        initialA = getA();
        futureA = _futureA;
        initialATimestamp = block.timestamp;
        futureATimestamp = _futureATimestamp;
    }

    /**
     * @dev Stops the ramping process.
     */
    function stopRampA() external {
        require(msg.sender == governance, "not governance");
        uint256 A = getA();
        initialA = A;
        futureA = A;
        initialATimestamp = block.timestamp;
        futureATimestamp = block.timestamp;
    }

    /**
     * @dev Pause mint/swap/redeem actions. Can unpause later.
     */
    function pause() external {
        require(msg.sender == governance, "not governance");
        require(!paused, "paused");

        paused = true;
    }

    /**
     * @dev Unpause mint/swap/redeem actions.
     */
    function unpause() external {
        require(msg.sender == governance, "not governance");
        require(paused, "not paused");

        paused = false;
    }

    /**
     * @dev Updates the admin role for the address.
     * @param _account Address to update admin role.
     * @param _allowed Whether the address is granted the admin role.
     */
    function setAdmin(address _account, bool _allowed) external {
        require(msg.sender == governance, "not governance");
        require(_account != address(0x0), "account not set");

        admins[_account] = _allowed;
    }
}