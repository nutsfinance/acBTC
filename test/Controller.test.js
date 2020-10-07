const { BN, expectRevert, time } = require('@openzeppelin/test-helpers');
const assert = require('assert');
const Controller = artifacts.require("Controller");
const MockToken = artifacts.require("MockToken");
const RewardedVault = artifacts.require("RewardedVault");

contract("Controller", async ([owner, user, user2, user3]) => {
    let token;
    let controller;

    beforeEach(async () => {
        token = await MockToken.new("TEST", "TEST", 18);
        controller = await Controller.new(token.address);
    });

    it("should initialize parameters", async () => {
        assert.strictEqual(await controller.rewardToken(), token.address);
        assert.strictEqual(await controller.governance(), owner);
        assert.strictEqual(await controller.reserve(), owner);
    });
    it("should allow to update reward token", async () => {
        const newToken = await MockToken.new("TEST", "TEST", 18);
        await expectRevert(controller.setRewardToken(newToken.address, {from: user}), "not governance");
        await controller.setRewardToken(newToken.address);
        assert.strictEqual(await controller.rewardToken(), newToken.address);
    });
    it("should allow to update govenance", async () => {
        await expectRevert(controller.setGovernance(user2, {from: user}), "not governance");
        await controller.setRewardToken(user2);
        assert.strictEqual(await controller.rewardToken(), user2);
    });
    it("should allow to update reserve", async () => {
        await expectRevert(controller.setReserve(user2, {from: user}), "not governance");
        await controller.setReserve(user2);
        assert.strictEqual(await controller.reserve(), user2);
    });
    it("should add vaults", async () => {
        assert.strictEqual((await controller.numVaults()).toNumber(), 0);
        await controller.addVault(user2);
        assert.strictEqual((await controller.numVaults()).toNumber(), 1);
        assert.strictEqual(await controller.vaults(0), user2);
    });
    it("should add rewards to vaults", async () => {
        const vaultToken = await MockToken.new("TEST", "TEST", 18);
        const vault = await RewardedVault.new("Mock Token Vault Token", "Mockv", controller.address, vaultToken.address);
        await controller.addVault(vault.address);
        assert.strictEqual((await token.balanceOf(vault.address)).toString(), '0');
        assert.strictEqual((await token.balanceOf(owner)).toString(), '0');
        await controller.addRewards(0, '150000000000000000000000');
        assert.strictEqual((await token.balanceOf(vault.address)).toString(), '150000000000000000000000');
        assert.strictEqual((await token.balanceOf(owner)).toString(), '60000000000000000000000');
    });
});