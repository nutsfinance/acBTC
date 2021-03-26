// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

import "./MockToken.sol";

/**
 * @notice Mock renBTC.
 */
contract MockRenBTC is MockToken {

    constructor() MockToken("Mock Ren BTC", "MockRenBTC", 8) {}
}