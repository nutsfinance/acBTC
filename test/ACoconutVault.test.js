const { expectRevert, time } = require('@openzeppelin/test-helpers');
const ACoconutVault = artifacts.require("ACoconutVault");
const RenCrv = artifacts.require("MockRenCrv");
const ACoconutBTC = artifacts.require("ACoconutBTC");
const Migrator = artifacts.require("MockMigrator");
const assert = require('assert');

contract('ACoconutBTC', async ([owner, user1, user2]) => {
    let renCrv;
    let aCoconutBTC;
    let aCoconutVault;
    let migrator;
    let migrationDue;
    beforeEach(async () => {
        renCrv = await RenCrv.new();
        aCoconutBTC = await ACoconutBTC.new();
        migrationDue = await time.latest() + 3600;
        aCoconutVault = await ACoconutVault.new(migrationDue, renCrv.address, aCoconutBTC.address);
        migrator = await Migrator.new(renCrv.address, aCoconutBTC.address, aCoconutVault.address);
    });
    it("should initialize params properly", async () => {
        assert.equal(await aCoconutVault.migrationDue(), migrationDue);
        assert.equal(await aCoconutVault.migrated(), false);
        assert.equal(await aCoconutVault.migrator(), "0x0000000000000000000000000000000000000000");
    });
    it("should be able to set migrator", async () => {
        await expectRevert(aCoconutVault.setMigrator(migrator.address, {from: user1}), "not governance");
        await aCoconutVault.setMigrator(migrator.address);
        assert.equal(await aCoconutVault.migrator(), migrator.address);
    });
    it("should be able to set migration due", async () => {
        const newMigrationDue = await time.latest() + 7200;
        await expectRevert(aCoconutVault.setMigrationDue(newMigrationDue, {from: user1}), "not governance");
        await aCoconutVault.setMigrationDue(newMigrationDue);
        assert.equal(await aCoconutVault.migrationDue(), newMigrationDue);
    });
    it("should be able to migrate", async () => {
        await renCrv.mint(aCoconutVault.address, 40000);
        assert.equal(await renCrv.balanceOf(aCoconutVault.address), 40000);

        await expectRevert(aCoconutVault.migrate({from: user1}), "not governance");
        await expectRevert(aCoconutVault.migrate(), "not due");
        await time.increase(4000);
        await expectRevert(aCoconutVault.migrate(), "migrator not set");
        await aCoconutVault.setMigrator(migrator.address);
        await aCoconutVault.migrate();
        assert.equal(await renCrv.balanceOf(aCoconutVault.address), 0);
        assert.equal(await aCoconutBTC.balanceOf(aCoconutVault.address), 48000);
        assert.equal(await aCoconutVault.migrate(), true);
        assert.equal(await aCoconutVault.migrator(), "0x0000000000000000000000000000000000000000");

        const newMigrationDue = Math.floor(new Date().getTime() / 1000 + 7200);
        await expectRevert(aCoconutVault.setMigrationDue(newMigrationDue), "migrated");
        const newMigrator = await Migrator.new(renCrv.address, aCoconutBTC.address, aCoconutVault.address);
        await expectRevert(aCoconutVault.setMigrator(newMigrator.address), "migrated");
    });
});