// SPDX-License-Identifier: MIT
pragma solidity 0.6.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @notice Interface for controller.
 */
interface IController {
    
    function rewardToken() external returns (address);
}