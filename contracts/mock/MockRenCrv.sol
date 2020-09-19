// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "./MockToken.sol";

/**
 * @notice Mock renCrv.
 */
contract MockRenCrv is MockToken {

    constructor() MockToken("Mock Ren CRV", "MockRenCrv") public {}

}