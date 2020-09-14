// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

/**
 * @dev Interface for the smart contract which receives the core fee.
 */
interface IFeeReceiver {
    function onFeeReceived(address feeToken, uint256 feeAmount) external;
}