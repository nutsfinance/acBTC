// SPDX-License-Identifier: MIT
pragma solidity 0.6.8;

/**
 * @notice Interface for Curve.fi's liquidity guage.
 */
interface ICurveGauge {
    function deposit(uint256) external;

    function balanceOf(address) external view returns (uint256);

    function withdraw(uint256) external;
}