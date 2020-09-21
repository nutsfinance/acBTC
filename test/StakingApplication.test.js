const { expectRevert, time } = require('@openzeppelin/test-helpers');
const assert = require('assert');
const RenCrv = artifacts.require("MockRenCrv");
const ACoconutBTC = artifacts.require("MockWBTC");
const Account = artifacts.require("Account");
const AccountFactory = artifacts.require("AccountFactory");
const ACoconutVault = artifacts.require("ACoconutVault");
const StakingApplication = artifacts.require("StakingApplication");

contract('StakingApplication', async ([owner, user1, user2]) => {
    let renCrv;
    let aCoconutBTC;
    let aCoconutVault;
    let accountFactory;
    let stakingApplication;
    beforeEach(async () => {
        renCrv = await RenCrv.new();
        aCoconutBTC = await ACoconutBTC.new();
        const migrationDue = (await time.latest()).toNumber() + 3600;
        aCoconutVault = await ACoconutVault.new(migrationDue, renCrv.address, aCoconutBTC.address);
        const account = await Account.new();
        accountFactory = await AccountFactory.new(account.address);
        stakingApplication = await StakingApplication.new(accountFactory.address);
    });
    it("should initialize parameters", async () => {
        assert.equal(await stakingApplication.governance(), owner);
        assert.equal(await stakingApplication.accountFactory(), accountFactory.address);
        assert.equal(await stakingApplication.numVaults(), 0);
    });
    it("should set governance", async () => {
        assert.equal(await stakingApplication.governance(), owner);
        await expectRevert(stakingApplication.setGovernance(user2, {from: user1}), "not governance");
        await stakingApplication.setGovernance(user1);
        assert.equal(await stakingApplication.governance(), user1);
    });
});