// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @notice Interface for ERC20 token which supports minting new tokens.
 */
interface IERC20Mintable is IERC20 {
    
    function mint(address _user, uint256 _amount) external;

}