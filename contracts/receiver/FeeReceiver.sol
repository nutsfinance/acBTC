// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "./IFeeReceiver.sol";

/**
 * @notice Contract that receives fees from BasketCore.
 */
contract FeeReceiver is IFeeReceiver {

    event FeeReceived(address indexed feeToken, uint256 feeAmount);

    /**
     * @dev Hook on fee received.
     * @param feeToken The address of the token paid as fee
     * @param feeAmount The amount of fee token
     */
    function onFeeReceived(address feeToken, uint256 feeAmount) public override {
        emit FeeReceived(feeToken, feeAmount);
    }
}