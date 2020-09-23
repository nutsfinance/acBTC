const { BN, expectRevert, time } = require('@openzeppelin/test-helpers');
const assert = require('assert');
const RenCrv = artifacts.require("MockRenCrv");
const ACoconut = artifacts.require("MockWBTC");
const Account = artifacts.require("Account");
const AccountFactory = artifacts.require("AccountFactory");
const ACoconutVault = artifacts.require("ACoconutVault");
const StakingApplication = artifacts.require("StakingApplication");

const assertAlmostEqual = function(expectedOrig, actualOrig) {
    const _1e18 = new BN('10').pow(new BN('18'));
    const expected = new BN(expectedOrig).div(_1e18).toNumber();
    const actual = new BN(actualOrig).div(_1e18).toNumber();

    assert.ok(Math.abs(expected - actual) <= 2, `Expected ${expected}, actual ${actual}`);
}

contract('StakingApplication', async ([owner, user1, user2]) => {
    let renCrv;
    let aCoconut;
    let aCoconutVault;
    let accountFactory;
    let stakingApplication;
    beforeEach(async () => {
        renCrv = await RenCrv.new();
        aCoconut = await ACoconut.new();
        const migrationDue = (await time.latest()).toNumber() + 3600;
        aCoconutVault = await ACoconutVault.new(migrationDue, renCrv.address, aCoconut.address);
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
    it("should be able to stake and unstake", async () => {
        await stakingApplication.addVault(aCoconutVault.address);
        await accountFactory.createAccount([stakingApplication.address], {from: user1});
        const account = await accountFactory.getAccount(user1);
        await renCrv.mint(account, 2000);
        assert.equal(await renCrv.balanceOf(account), 2000);

        await stakingApplication.stake(0, 800, {from: user1});
        assert.equal(await renCrv.balanceOf(account), 1200);
        assert.equal(await aCoconutVault.balanceOf(account), 800);
        assert.equal(await stakingApplication.getStakeBalance(0, {from: user1}), 800);

        await stakingApplication.unstake(0, 300, {from: user1});
        assert.equal(await renCrv.balanceOf(account), 1500);
        assert.equal(await aCoconutVault.balanceOf(account), 500);
        assert.equal(await stakingApplication.getStakeBalance(0, {from: user1}), 500);
    });
    it("should be able to get rewards", async () => {
        await stakingApplication.addVault(aCoconutVault.address);
        await accountFactory.createAccount([stakingApplication.address], {from: user1});
        const account = await accountFactory.getAccount(user1);
        await renCrv.mint(account, 2000);
        assert.equal(await renCrv.balanceOf(account), 2000);

        await stakingApplication.stake(0, 800, {from: user1});
        assert.equal(await stakingApplication.getUnclaimedReward(0, {from: user1}), 0);
        await aCoconut.mint(owner, web3.utils.toWei('40000'));
        await aCoconut.approve(aCoconutVault.address, web3.utils.toWei('40000'));
        await aCoconutVault.addRewardAmount(web3.utils.toWei('40000'));

        // After 7 days, user1 should get all the rewards!
        assert.equal(await aCoconut.balanceOf(account), 0);
        await time.increase(3600 * 24 * 8);
        assertAlmostEqual(await stakingApplication.getUnclaimedReward(0, {from: user1}), web3.utils.toWei('40000'));
        assert.equal(await stakingApplication.getClaimedReward(0, {from: user1}), 0);
        await stakingApplication.claimRewards(0, {from: user1});
        assert.equal(await stakingApplication.getUnclaimedReward(0, {from: user1}), 0);
        assertAlmostEqual(await stakingApplication.getClaimedReward(0, {from: user1}), web3.utils.toWei('40000'));
        assertAlmostEqual(await aCoconut.balanceOf(account), web3.utils.toWei('40000'));
    });
});