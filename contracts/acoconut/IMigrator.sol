// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

/**
 * @notice Interface for the migrator.
 */
interface IMigrator {

    /**
     * @dev What token is migrated from.
     */
    function want() external returns (address);

    /**
     * @dev What token is migrated to.
     */
    function get() external returns (address);

    /**
     * @dev Performs the token migration.
     */
    function migrate() external;
}