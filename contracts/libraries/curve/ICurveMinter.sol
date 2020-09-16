// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

/**
 * @notice Interface for Curve.fi's CRV minter.
 */
interface ICurveMinter {
    function mint(address) external;
}