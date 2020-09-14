// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "./BasketToken.sol";

/**
 * @notice The acBTC token contract.
 */
contract AcBTC is BasketToken {
    constructor(address basketCoreAddress) BasketToken("Acoconut BTC", "acBTC", basketCoreAddress) public {}
}