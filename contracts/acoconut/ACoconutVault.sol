// SPDX-License-Identifier: MIT
pragma solidity 0.6.8;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "../libraries/vaults/RewardedVault.sol";
import "../libraries/interfaces/IStrategy.sol";
import "../libraries/interfaces/IMigrator.sol";

/**
 * @notice A rewarded vault that could perform token migration.
 */
contract ACoconutVault is RewardedVault {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // When the vault can be migrated.
    uint256 public migrationDue;
    // Whether the vault is migrated.
    bool public migrated;
    // The contract that performs the migration.
    address public migrator;

    constructor(string memory _name, string memory _symbol, address _controller, address _vaultToken, uint256 _migrationDue)
        public RewardedVault(_name, _symbol, _controller, _vaultToken) {
        migrationDue = _migrationDue;
    }

    /**
     * @dev Updates the migrator address.
     */
    function setMigrator(address _migrator) public {
        require(msg.sender == governance, "not governance");
        require(_migrator != address(0x0), "migrator not set");
        require(!migrated, "migrated");
        require(IMigrator(_migrator).want() == address(token), "different token");
        migrator = _migrator;
    }

    /**
     * @dev Updates the timestamp when the vault can be migrated. Cannot be updated after migration.
     */
    function setMigrationDue(uint256 _migrationDue) public {
        require(msg.sender == governance, "not governance");
        require(!migrated, "migrated");

        migrationDue = _migrationDue;
    }

    /**
     * @dev Performs the migration.
     */
    function migrate() public {
        require(msg.sender == governance, "not governance");
        require(block.timestamp >= migrationDue, "not due");
        require(!migrated, "migrated");
        require(migrator != address(0x0), "migrator not set");

        if (strategy != address(0x0)) {
            // Final harvest
            IStrategy(strategy).harvest();
            // Withdraws all tokens and sends them to migrator
            IStrategy(strategy).withdrawAll();
        }
        IERC20(token).safeTransfer(migrator, IERC20(token).balanceOf(address(this)));

        // Triggers the migration.
        IMigrator(migrator).migrate();
        migrated = true;

        // Important: Updates the token and clears the strategy!
        token = IERC20(IMigrator(migrator).get());
        // Clears the strategy as token is different.
        strategy = address(0x0);
    }
}