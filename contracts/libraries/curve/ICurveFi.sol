// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

/**
 * @notice Interface for Curve.fi's REN pool.
 */
interface ICurveFi {
    function get_virtual_price() external view returns (uint256);

    function add_liquidity(
        // renBTC pool
        uint256[2] calldata amounts,
        uint256 min_mint_amount
    ) external;

    function remove_liquidity_imbalance(uint256[2] calldata amounts, uint256 max_burn_amount) external;

    function remove_liquidity(uint256 _amount, uint256[2] calldata amounts) external;

    function exchange(
        int128 from,
        int128 to,
        uint256 _from_amount,
        uint256 _min_to_amount
    ) external;
}