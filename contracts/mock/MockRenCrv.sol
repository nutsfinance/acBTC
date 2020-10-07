// SPDX-License-Identifier: MIT
pragma solidity 0.6.8;

import "./MockToken.sol";

/**
 * @notice Mock renCrv.
 */
contract MockRenCrv is MockToken {

    constructor() MockToken("Mock Ren CRV", "MockRenCrv", 18) public {}

}