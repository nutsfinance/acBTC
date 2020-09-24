// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../libraries/vaults/IStrategy.sol";
import "./ACoconutSwap.sol";

/**
 * @notice Strategy to earn acBTC.
 */
contract StrategyACoconutBTC is IStrategy {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address public constant override want = address(0x0); // To be added for acBTC token
    address public constant acSwap = address(0x0);    // To be added for ACoconutSwap

    address public governance;
    address public vault;

    address reserveRecipient;
    uint256 public reserveRate = 0;
    uint256 public constant reserveRateMax = 10000;

    constructor(address _vault) public {
        require(_vault != address(0x0), "vault not set");
        governance = msg.sender;
        reserveRecipient = msg.sender;  // Initialize the reserve recipient to governance
        vault = _vault;
    }

    function setGovernance(address _governance) external {
        require(msg.sender == governance, "not governance");
        governance = _governance;
    }

    function setReserveRate(uint256 _reserveRate) external {
        require(msg.sender == governance, "not governance");
        require(_reserveRate <= reserveRateMax, "invalid rate");

        reserveRate = _reserveRate;
    } 

    function setReserveRecipient(address _reserveRecipient) external {
        require(msg.sender == governance, "not governance");
        require(_reserveRecipient != address(0x0), "recipient not set");

        reserveRecipient = _reserveRecipient;
    }

    /**
     * @dev Returns the total amount of tokens deposited in this strategy.
     */
    function balanceOf() public view override returns (uint256) {
        return IERC20(want).balanceOf(address(this));
    }

    /**
     * @dev Deposits the token to start earning.
     */
    function deposit() public override {
        // NO OP.
    }

    /**
     * @dev Withdraws partial funds from the strategy.
     */
    function withdraw(uint256 _amount) public override {
        return IERC20(want).safeTransfer(vault, _amount);
    }

    /**
     * @dev Withdraws all funds from the strategy.
     */
    function withdrawAll() public override returns (uint256) {
        uint256 balance = balanceOf();
        IERC20(want).safeTransfer(vault, balance);

        return balance;
    }
    
    /**
     * @dev Claims yield and convert it back to want token.
     */
    function harvest() public override {
        uint256 feeAmount = ACoconutSwap(acSwap).collectFees();
        if (feeAmount > 0 && reserveRate > 0 && reserveRecipient != address(0x0)) {
            uint256 reserveAmount = feeAmount.mul(reserveRate).div(reserveRateMax);
            IERC20(want).safeTransfer(reserveRecipient, reserveAmount);
        }
    }
}