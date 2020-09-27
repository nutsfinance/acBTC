// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "./IERC20Mintable.sol";

/**
 * @notice Interface for ERC20 token which supports mint and burn.
 */
interface IERC20MintableBurnable is IERC20Mintable {
    
    function burn(address _user, uint256 _amount) external;
}