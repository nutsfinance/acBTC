// SPDX-License-Identifier: MIT
pragma solidity 0.6.8;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./ACoconutSwap.sol";

/**
 * @notice Contract that collects transaction fees from ACoconutSwap.
 */
contract ACoconutMaker {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    event FeeCollected(address indexed token, uint256 feeAmount, uint256 feeRewarded, uint256 feeReserved);

    address public governance;

    address public acBtc;
    address public acBtcVault;
    address public acSwap;
    address public reserve;
    uint256 public reserveRate = 0;
    uint256 public constant reserveRateMax = 10000;

    constructor(address _acBtc, address _acBtcVault, address _acSwap) public {
        require(_acBtc != address(0x0), "acBTC not set");
        require(_acBtcVault != address(0x0), "acBTC vault not set");
        require(_acSwap != address(0x0), "acSwap not set");

        acBtc = _acBtc;
        acBtcVault = _acBtcVault;
        acSwap = _acSwap;
        governance = msg.sender;
        reserve = msg.sender;
    }

    /**
     * @dev Updates the govenance address.
     */
    function setGovernance(address _governance) external {
        require(msg.sender == governance, "not governance");
        governance = _governance;
    }

    /**
     * @dev Updates the reserve rate.
     */
    function setReserveRate(uint256 _reserveRate) external {
        require(msg.sender == governance, "not governance");
        require(_reserveRate <= reserveRateMax, "invalid rate");

        reserveRate = _reserveRate;
    } 

    /**
     * @dev Updates the reserve address.
     */
    function setReserve(address _reserve) external {
        require(msg.sender == governance, "not governance");
        require(_reserve != address(0x0), "reserve not set");

        reserve = _reserve;
    }

    /**
     * @dev Allocates swap fees accured in the contract.
     */
    function allocateFees() public {
        require(msg.sender == governance, "not governance");
        uint256 balance = IERC20(acBtc).balanceOf(address(this));
        uint256 reserveAmount = 0;

        if (balance > 0 && reserveRate > 0 && reserve != address(0x0)) {
            reserveAmount = balance.mul(reserveRate).div(reserveRateMax);
            IERC20(acBtc).safeTransfer(reserve, reserveAmount);
            balance = balance.sub(reserveAmount);
        }

        IERC20(acBtc).safeTransfer(acBtcVault, balance);
        emit FeeCollected(acBtc, balance.add(reserveAmount), balance, reserveAmount);
    }
    
    /**
     * @dev Collect fees from the ACoconut Swap.
     * This contract must be an admin of ACoconut Swap in order to proceed.
     */
    function collectFees() public {
        require(msg.sender == governance, "not governance");
        ACoconutSwap(acSwap).collectFee();
        allocateFees();
    }

    /**
     * @dev Used to salvage any token deposited into the contract by mistake.
     * @param _tokenAddress Token address to salvage.
     * @param _amount Amount of token to salvage.
     */
    function salvage(address _tokenAddress, uint256 _amount) public {
        require(msg.sender == governance, "not governance");
        require(_tokenAddress != acBtc, "cannot salvage");
        require(_amount > 0, "zero amount");
        IERC20(_tokenAddress).safeTransfer(governance, _amount);
    }
}