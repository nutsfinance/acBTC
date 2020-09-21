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
    it("should add vault", async () => {
        await expectRevert(stakingApplication.addVault(aCoconutVault.address, {from: user1}), "not governance");
        await stakingApplication.addVault(aCoconutVault.address);
        assert.equal(await stakingApplication.numVaults(), 1);
        assert.equal(await stakingApplication.vaults(0), aCoconutVault.address);
    });
    it("should stake on valid vault", async () => {
        await expectRevert(stakingApplication.stake(0, 200), "no vault");
        await expectRevert(stakingApplication.unstake(0, 200), "no vault");
        await expectRevert(stakingApplication.claimRewards(0), "no vault");
    });
    it("should have account to stake", async () => {
        await stakingApplication.addVault(aCoconutVault.address);
        await renCrv.mint(user1, 2000);
        await expectRevert(stakingApplication.stake(0, 1000, {from: user1}), "no account");
        await accountFactory.createAccount([], {from: user1});
        await expectRevert(stakingApplication.stake(0, 1000, {from: user1}), "not operator");
    });
    it("should be able to stake", async () => {
        await stakingApplication.addVault(aCoconutVault.address);
        await accountFactory.createAccount([stakingApplication.address], {from: user1});
        const account = await accountFactory.getAccount(user1);
        console.log(account);
        await renCrv.mint(account, 2000);
        assert.equal(await renCrv.balanceOf(account), 2000);
        console.log(renCrv.address);
        console.log(await aCoconutVault.token());
        console.log((await renCrv.allowance(account, stakingApplication.address)).toNumber());

        await stakingApplication.stake(0, 800, {from: user1});
        assert.equal(await renCrv.balanceOf(account), 1200);
        assert.equal(await aCoconutVault.balanceOf(account), 800);
    });
});