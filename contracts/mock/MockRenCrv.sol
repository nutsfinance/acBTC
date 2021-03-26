// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

import "./MockToken.sol";

/**
 * @notice Mock renCrv.
 */
contract MockRenCrv is MockToken {

    constructor() MockToken("Mock Ren CRV", "MockRenCrv", 18) {}

}