// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @notice Interface for the pool token.
 */
interface IPoolToken is IERC20 {
    
    function mint(address _user, uint256 _amount) external;

    function burn(address _user, uint256 _amount) external;
}