// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "../libraries/vaults/IStrategy.sol";
import "../libraries/vaults/RewardedVault.sol";
import "./IMigrator.sol";

contract ACoconutVault is RewardedVault {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    // When the vault is ended. Migration can be done only after the vault is ended.
    // After the vault is ended, no new deposit is allowed but user can withdraw.
    uint256 vaultEndTimestamp;
    // Whether migration is completed.
    bool migrated;
    address migrator;

    constructor(uint256 _vaultDuration, address _rewardToken, address _vaultToken) public RewardedVault(_rewardToken, _vaultToken) {
        require(_vaultDuration > 0, "ACoconutVault: Duration not set");
        vaultEndTimestamp = block.timestamp + _vaultDuration;
    }

    /**
     * @dev Updates the migrator address.
     */
    function setMigrator(address _migrator) public {
        require(msg.sender == governance, "ACoconutVault: not governance");
        require(_migrator != address(0x0), "ACoconutVault: migrator not set");
        require(!migrated, "ACoconutVault: migrated");
        require(IMigrator(_migrator).want() == address(token), "ACoconutVault: different token");
        migrator = _migrator;
    }

    /**
     * @dev Updates the end timestamp of the vault.
     */
    function setVaultEndTimestamp(uint256 _vaultEndTimestamp) public {
        require(msg.sender == governance, "ACoconutVault: not governance");
        require(!migrated, "ACoconutVault: migrated");
        require(_vaultEndTimestamp > block.timestamp, "ACoconutVault: too early");

        vaultEndTimestamp = _vaultEndTimestamp;
    }

    /**
     * @dev Performs the migration.
     */
    function migrate() public {
        require(msg.sender == governance, "ACoconutVault: not governance");
        require(block.timestamp >= vaultEndTimestamp, "ACoconutVault: too early");
        require(!migrated, "ACoconutVault: migrated");
        require(migrator != address(0x0), "ACoconutVault: migrator not set");

        // Final harvest
        IStrategy(strategy).harvest();
        // Withdraws all tokens and sends them to migrator
        IStrategy(strategy).withdrawAll();
        IERC20(token).safeTransfer(migrator, IERC20(token).balanceOf(address(this)));

        // Triggers the migration.
        IMigrator(migrator).migrate();
        migrated = true;
    }

    /**
     * @dev Deposit some balance into the vault.
     */
    function deposit(uint256 amount) public override {
        require(block.timestamp < vaultEndTimestamp, "ACoconutVault: too late");
        super.deposit(amount);
    }

    /**
     * @dev Deposit all balance into the vault.
     */
    function depositAll() public override {
        require(block.timestamp < vaultEndTimestamp, "ACoconutVault: too late");
        super.depositAll();
    }

    /**
     * @dev Withdraw from the vault. If it's withdrawn before migration, what's withdrawn is the vault token.
     * If it's withdrawn after migration, what's withdrawn is the migration get token.
     */
    function withdraw(uint256 _shares) public override {
        if (!migrated) {
            super.withdraw(_shares);
        } else {
            // After the migration, the migrator should be always set.
            IERC20 get = IERC20(IMigrator(migrator).get());
            uint256 amount = get.balanceOf(address(this)).mul(_shares).div(totalSupply());
            get.safeTransfer(msg.sender, amount);

            _burn(msg.sender, _shares);

            emit Withdrawn(msg.sender, address(get), amount, _shares);
        }
    }

    /**
     * @dev Withdraw all balance from the vault. If it's withdrawn before migration, what's withdrawn is the vault token.
     * If it's withdrawn after migration, what's withdrawn is the migration get token.
     */
    function withdrawAll() public override {
        withdraw(balanceOf(msg.sender));
    }
}