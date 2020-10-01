const { expectRevert } = require('@openzeppelin/test-helpers');
const assert = require('assert');
const MockToken = artifacts.require("MockWBTC");
const Vault = artifacts.require("Vault");
const Strategy = artifacts.require("MockStrategy");

contract("Vault", async ([owner, user, user2, user3]) => {
    let token;
    let vault;
    let strategy;
    let anotherToken;

    beforeEach(async () => {
        token = await MockToken.new();
        anotherToken = await MockToken.new();
        vault = await Vault.new("Mock Token Vault Token", "Mockv", token.address);
        strategy = await Strategy.new(token.address, vault.address);
    });
    it("should set governance", async () => {
        assert.strictEqual(await vault.governance(), owner);
        await expectRevert(vault.setGovernance(user2, {from: user}), "not governance");
        await vault.setGovernance(user);
        assert.strictEqual(await vault.governance(), user);
    });
    it("should set strategy", async () => {
        assert.strictEqual(await vault.strategy(), '0x0000000000000000000000000000000000000000');
        await expectRevert(vault.setStrategy(strategy.address, {from: user}), "not governance");
        await vault.setStrategy(strategy.address);
        assert.strictEqual(await vault.strategy(), strategy.address);
    });
    it("should set strategist", async () => {
        assert.strictEqual(await vault.strategist(), owner);
        await expectRevert(vault.setStrategist(user2, {from: user}), "not governance");
        await vault.setStrategist(user);
        assert.strictEqual(await vault.strategist(), user);
    });
    it("should be able to deposit and withdraw with no strategy", async () => {
        await token.mint(user, 100);
        await token.approve(vault.address, 100, {from: user});
        await vault.deposit(40, {from: user});
        assert.strictEqual((await token.balanceOf(vault.address)).toNumber(), 40);
        assert.strictEqual((await token.balanceOf(user)).toNumber(), 60);
        assert.strictEqual((await vault.balance()).toNumber(), 40);
        assert.strictEqual((await vault.totalSupply()).toNumber(), 40);
        assert.strictEqual((await vault.balanceOf(user)).toNumber(), 40);
        assert.strictEqual((await vault.getPricePerFullShare()).toString(), '1000000000000000000');

        await vault.withdraw(10, {from: user});
        assert.strictEqual((await token.balanceOf(vault.address)).toNumber(), 30);
        assert.strictEqual((await token.balanceOf(user)).toNumber(), 70);
        assert.strictEqual((await vault.balance()).toNumber(), 30);
        assert.strictEqual((await vault.totalSupply()).toNumber(), 30);
        assert.strictEqual((await vault.balanceOf(user)).toNumber(), 30);
        assert.strictEqual((await vault.getPricePerFullShare()).toString(), '1000000000000000000');

        await vault.withdrawAll({from: user});
        assert.strictEqual((await token.balanceOf(vault.address)).toNumber(), 0);
        assert.strictEqual((await token.balanceOf(user)).toNumber(), 100);
        assert.strictEqual((await vault.balance()).toNumber(), 0);
        assert.strictEqual((await vault.totalSupply()).toNumber(), 0);
        assert.strictEqual((await vault.balanceOf(user)).toNumber(), 0);
    });
    it("should be able to deposit all and withdraw all with no strategy", async () => {
        await token.mint(user, 120);
        await token.approve(vault.address, 120, {from: user});
        await vault.depositAll({from: user});
        assert.strictEqual((await token.balanceOf(vault.address)).toNumber(), 120);
        assert.strictEqual((await token.balanceOf(user)).toNumber(), 0);
        assert.strictEqual((await vault.balance()).toNumber(), 120);
        assert.strictEqual((await vault.totalSupply()).toNumber(), 120);
        assert.strictEqual((await vault.balanceOf(user)).toNumber(), 120);
        assert.strictEqual((await vault.getPricePerFullShare()).toString(), '1000000000000000000');

        await vault.withdraw(40, {from: user});
        assert.strictEqual((await token.balanceOf(vault.address)).toNumber(), 80);
        assert.strictEqual((await token.balanceOf(user)).toNumber(), 40);
        assert.strictEqual((await vault.balance()).toNumber(), 80);
        assert.strictEqual((await vault.totalSupply()).toNumber(), 80);
        assert.strictEqual((await vault.balanceOf(user)).toNumber(), 80);
        assert.strictEqual((await vault.getPricePerFullShare()).toString(), '1000000000000000000');

        await vault.withdrawAll({from: user});
        assert.strictEqual((await token.balanceOf(vault.address)).toNumber(), 0);
        assert.strictEqual((await token.balanceOf(user)).toNumber(), 120);
        assert.strictEqual((await vault.balance()).toNumber(), 0);
        assert.strictEqual((await vault.totalSupply()).toNumber(), 0);
        assert.strictEqual((await vault.balanceOf(user)).toNumber(), 0);
    });
    it("should be able to deposit all and withdraw all with dummy strategy", async () => {
        await vault.setStrategy(strategy.address);
        await token.mint(user, 120);
        await token.approve(vault.address, 120, {from: user});
        await vault.depositAll({from: user});
        assert.strictEqual((await token.balanceOf(vault.address)).toNumber(), 120);
        assert.strictEqual((await token.balanceOf(user)).toNumber(), 0);
        assert.strictEqual((await vault.balance()).toNumber(), 120);
        assert.strictEqual((await vault.totalSupply()).toNumber(), 120);
        assert.strictEqual((await vault.balanceOf(user)).toNumber(), 120);
        assert.strictEqual((await vault.getPricePerFullShare()).toString(), '1000000000000000000');

        await vault.withdraw(40, {from: user});
        assert.strictEqual((await token.balanceOf(vault.address)).toNumber(), 80);
        assert.strictEqual((await token.balanceOf(user)).toNumber(), 40);
        assert.strictEqual((await vault.balance()).toNumber(), 80);
        assert.strictEqual((await vault.totalSupply()).toNumber(), 80);
        assert.strictEqual((await vault.balanceOf(user)).toNumber(), 80);
        assert.strictEqual((await vault.getPricePerFullShare()).toString(), '1000000000000000000');

        await vault.withdrawAll({from: user});
        assert.strictEqual((await token.balanceOf(vault.address)).toNumber(), 0);
        assert.strictEqual((await token.balanceOf(user)).toNumber(), 120);
        assert.strictEqual((await vault.balance()).toNumber(), 0);
        assert.strictEqual((await vault.totalSupply()).toNumber(), 0);
        assert.strictEqual((await vault.balanceOf(user)).toNumber(), 0);
    });

    it("should be able to deposit into and withdraw from strategy", async () => {
        await vault.setStrategy(strategy.address);
        await token.mint(user, 200);
        await token.approve(vault.address, 200, {from: user});
        await vault.depositAll({from: user});
        // Deposit into strategy!
        await vault.earn();
        assert.strictEqual((await vault.balance()).toNumber(), 200);
        assert.strictEqual((await strategy.balanceOf()).toNumber(), 200);
        assert.strictEqual((await token.balanceOf(vault.address)).toNumber(), 0);
        assert.strictEqual((await token.balanceOf(strategy.address)).toNumber(), 200);

        // Harvest from strategy!
        await strategy.harvest();
        assert.strictEqual((await vault.balance()).toNumber(), 240);
        assert.strictEqual((await strategy.balanceOf()).toNumber(), 240);
        assert.strictEqual((await token.balanceOf(vault.address)).toNumber(), 0);
        assert.strictEqual((await token.balanceOf(strategy.address)).toNumber(), 240);
        assert.strictEqual((await vault.getPricePerFullShare()).toString(), '1200000000000000000');

        // Withdraw from vault
        assert.strictEqual((await vault.totalSupply()).toNumber(), 200);
        assert.strictEqual((await vault.balanceOf(user)).toNumber(), 200);
        assert.strictEqual((await token.balanceOf(user)).toNumber(), 0);
        await vault.withdraw(60, {from: user});
        assert.strictEqual((await vault.totalSupply()).toNumber(), 140);
        assert.strictEqual((await vault.balanceOf(user)).toNumber(), 140);
        assert.strictEqual((await vault.balance()).toNumber(), 168);
        assert.strictEqual((await token.balanceOf(user)).toNumber(), 72);
        assert.strictEqual((await token.balanceOf(vault.address)).toNumber(), 0);
        assert.strictEqual((await token.balanceOf(strategy.address)).toNumber(), 168);

        await vault.withdrawAll({from: user});
        assert.strictEqual((await vault.totalSupply()).toNumber(), 0);
        assert.strictEqual((await vault.balanceOf(user)).toNumber(), 0);
        assert.strictEqual((await vault.balance()).toNumber(), 0);
        assert.strictEqual((await token.balanceOf(user)).toNumber(), 240);
        assert.strictEqual((await token.balanceOf(vault.address)).toNumber(), 0);
        assert.strictEqual((await token.balanceOf(strategy.address)).toNumber(), 0);
    });
    it("should only allow governance or strategist to harvest", async () => {
        await expectRevert(vault.harvest({from: user}), "not authorized");
    });
    it("should not allow to harvest if strategy is not set", async () => {
        await expectRevert(vault.harvest({from: owner}), "no strategy");
    });
    it("should allow strategist to harvest", async () => {
        await vault.setStrategy(strategy.address);
        await vault.setStrategist(user);
        await vault.harvest({from: user});
    });
    it("should update share prices after harvest", async () => {
        await vault.setStrategy(strategy.address);
        await token.mint(user, 200);
        await token.approve(vault.address, 200, {from: user});
        await vault.depositAll({from: user});
        // Deposit into strategy!
        await vault.earn();
        // Harvest from strategy!
        await vault.harvest();
        assert.strictEqual((await vault.getPricePerFullShare()).toString(), '1200000000000000000');

        // Second user deposits 360 tokens
        await token.mint(user2, 360);
        await token.approve(vault.address, 360, {from: user2});
        await vault.depositAll({from: user2});
        assert.strictEqual((await vault.totalSupply()).toNumber(), 500);
        assert.strictEqual((await vault.balanceOf(user2)).toNumber(), 300);
        assert.strictEqual((await vault.balance()).toNumber(), 600);
        assert.strictEqual((await strategy.balanceOf()).toNumber(), 240);
        assert.strictEqual((await token.balanceOf(vault.address)).toNumber(), 360);
        assert.strictEqual((await token.balanceOf(strategy.address)).toNumber(), 240);

        await vault.earn();
        assert.strictEqual((await strategy.balanceOf()).toNumber(), 600);
        assert.strictEqual((await token.balanceOf(vault.address)).toNumber(), 0);
        assert.strictEqual((await token.balanceOf(strategy.address)).toNumber(), 600);
    });
    it("should only allow governance or strategist to salvage", async () => {
        await expectRevert(vault.salvage(anotherToken.address, 100, {from: user}), "not authorized");
    });
    it("should allow strategist to salvage", async () => {
        await anotherToken.mint(vault.address, 200);
        assert.strictEqual((await anotherToken.balanceOf(owner)).toNumber(), 0);
        await vault.setStrategist(user);
        await vault.salvage(anotherToken.address, 150, {from: user});
        assert.strictEqual((await anotherToken.balanceOf(owner)).toNumber(), 150);
        assert.strictEqual((await anotherToken.balanceOf(vault.address)).toNumber(), 50);
    });
});