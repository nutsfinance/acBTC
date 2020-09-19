// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "./MockToken.sol";

/**
 * @notice Mock renBTC.
 */
contract MockRenBTC is MockToken {

    constructor() MockToken("Mock Ren BTC", "MockRenBTC") public {}
}