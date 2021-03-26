// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

import "./MockToken.sol";

/**
 * @notice Mock WBTC.
 */
contract MockWBTC is MockToken {

    constructor() MockToken("Mock Wrapped BTC", "MockWBTC", 8) {}
}