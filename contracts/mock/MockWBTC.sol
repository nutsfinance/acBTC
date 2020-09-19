// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "./MockToken.sol";

/**
 * @notice Mock WBTC.
 */
contract MockWBTC is MockToken {

    constructor() MockToken("Mock Wrapped BTC", "MockWBTC") public {}
}