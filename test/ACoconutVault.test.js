const { expectRevert, time } = require('@openzeppelin/test-helpers');
const Controller = artifacts.require("Controller");
const ACoconutVault = artifacts.require("ACoconutVault");
const RenCrv = artifacts.require("MockRenCrv");
const ACoconut = artifacts.require("MockWBTC");
const ACoconutBTC = artifacts.require("MockWBTC");
const Migrator = artifacts.require("MockMigrator");
const assert = require('assert');

contract('ACoconutVault', async ([owner, user1, user2]) => {
    let renCrv;
    let aCoconut;
    let aCoconutBTC;
    let controller;
    let aCoconutVault;
    let migrator;
    let migrationDue;
    beforeEach(async () => {
        renCrv = await RenCrv.new();
        aCoconut = await ACoconut.new();
        aCoconutBTC = await ACoconutBTC.new();
        controller = await Controller.new(aCoconut.address);
        migrationDue = (await time.latest()).toNumber() + 3600;
        aCoconutVault = await ACoconutVault.new("ACoconut BTC Vault Token", "acBTCv", controller.address, renCrv.address, migrationDue);
        migrator = await Migrator.new(renCrv.address, aCoconutBTC.address, aCoconutVault.address);
    });
    it("should initialize params properly", async () => {
        assert.strictEqual((await aCoconutVault.migrationDue()).toNumber(), migrationDue);
        assert.strictEqual(await aCoconutVault.migrated(), false);
        assert.strictEqual(await aCoconutVault.migrator(), "0x0000000000000000000000000000000000000000");
    });
    it("should be able to set migrator", async () => {
        await expectRevert(aCoconutVault.setMigrator(migrator.address, {from: user1}), "not governance");
        await aCoconutVault.setMigrator(migrator.address);
        assert.strictEqual(await aCoconutVault.migrator(), migrator.address);
    });
    it("should be able to set migration due", async () => {
        const newMigrationDue = (await time.latest()).toNumber() + 7200;
        await expectRevert(aCoconutVault.setMigrationDue(newMigrationDue, {from: user1}), "not governance");
        await aCoconutVault.setMigrationDue(newMigrationDue);
        assert.strictEqual((await aCoconutVault.migrationDue()).toNumber(), newMigrationDue);
    });
    it("should be able to migrate", async () => {
        await renCrv.mint(aCoconutVault.address, 40000);
        assert.strictEqual((await renCrv.balanceOf(aCoconutVault.address)).toNumber(), 40000);

        await expectRevert(aCoconutVault.migrate({from: user1}), "not governance");
        await expectRevert(aCoconutVault.migrate(), "not due");
        await time.increase(4000);
        await expectRevert(aCoconutVault.migrate(), "migrator not set");
        await aCoconutVault.setMigrator(migrator.address);
        await aCoconutVault.migrate();
        assert.strictEqual((await renCrv.balanceOf(aCoconutVault.address)).toNumber(), 0);
        assert.strictEqual((await aCoconutBTC.balanceOf(aCoconutVault.address)).toNumber(), 48000);
        assert.strictEqual(await aCoconutVault.migrated(), true);
        assert.strictEqual(await aCoconutVault.strategy(), "0x0000000000000000000000000000000000000000");

        const newMigrationDue = (await time.latest()).toNumber() + 7200;
        await expectRevert(aCoconutVault.setMigrationDue(newMigrationDue), "migrated");
        const newMigrator = await Migrator.new(renCrv.address, aCoconutBTC.address, aCoconutVault.address);
        await expectRevert(aCoconutVault.setMigrator(newMigrator.address), "migrated");
    });
});