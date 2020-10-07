// SPDX-License-Identifier: MIT
pragma solidity 0.6.8;

import "./MockToken.sol";

/**
 * @notice Mock WBTC.
 */
contract MockWBTC is MockToken {

    constructor() MockToken("Mock Wrapped BTC", "MockWBTC", 8) public {}
}