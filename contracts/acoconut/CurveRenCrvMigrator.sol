// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "./IMigrator.sol";

contract CurveRenCrvMigrator is IMigrator {

    address public constant override want = address(0x49849C98ae39Fff122806C06791Fa73784FB3675); // renCrv token
    address public constant override get = address(0);  // To be added after ACoconutBTC is deployed

    /**
     * @dev Performs the token migration.
     */
    function migrate() public override {}
}