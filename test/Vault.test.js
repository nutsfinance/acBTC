const { expectRevert } = require('@openzeppelin/test-helpers');
const assert = require('assert');
const MockToken = artifacts.require("MockWBTC");
const Vault = artifacts.require("Vault");
const Strategy = artifacts.require("MockStrategy");

contract("Vault", async ([owner, user, user2, user3]) => {
    let token;
    let vault;
    let strategy;

    beforeEach(async () => {
        token = await MockToken.new();
        vault = await Vault.new(token.address);
        strategy = await Strategy.new(token.address, vault.address);
    });
    it("should set governance", async () => {
        assert.equal(await vault.governance(), owner);
        await expectRevert(vault.setGovernance(user2, {from: user}), "not governance");
        await vault.setGovernance(user);
        assert.equal(await vault.governance(), user);
    });
    it("should set strategy", async () => {
        assert.equal(await vault.strategy(), '0x0000000000000000000000000000000000000000');
        await expectRevert(vault.setStrategy(strategy.address, {from: user}), "not governance");
        await vault.setStrategy(strategy.address);
        assert.equal(await vault.strategy(), strategy.address);
    });
    it("should be able to deposit and withdraw with no strategy", async () => {
        await token.mint(user, 100);
        await token.approve(vault.address, 100, {from: user});
        await vault.deposit(40, {from: user});
        assert.equal(await token.balanceOf(vault.address), 40);
        assert.equal(await token.balanceOf(user), 60);
        assert.equal(await vault.balance(), 40);
        assert.equal(await vault.totalSupply(), 40);
        assert.equal(await vault.balanceOf(user), 40);
        assert.equal(await vault.getPricePerFullShare(), '1000000000000000000');

        await vault.withdraw(10, {from: user});
        assert.equal(await token.balanceOf(vault.address), 30);
        assert.equal(await token.balanceOf(user), 70);
        assert.equal(await vault.balance(), 30);
        assert.equal(await vault.totalSupply(), 30);
        assert.equal(await vault.balanceOf(user), 30);
        assert.equal(await vault.getPricePerFullShare(), '1000000000000000000');

        await vault.withdrawAll({from: user});
        assert.equal(await token.balanceOf(vault.address), 0);
        assert.equal(await token.balanceOf(user), 100);
        assert.equal(await vault.balance(), 0);
        assert.equal(await vault.totalSupply(), 0);
        assert.equal(await vault.balanceOf(user), 0);
    });
    it("should be able to deposit all and withdraw all with no strategy", async () => {
        await token.mint(user, 120);
        await token.approve(vault.address, 120, {from: user});
        await vault.depositAll({from: user});
        assert.equal(await token.balanceOf(vault.address), 120);
        assert.equal(await token.balanceOf(user), 0);
        assert.equal(await vault.balance(), 120);
        assert.equal(await vault.totalSupply(), 120);
        assert.equal(await vault.balanceOf(user), 120);
        assert.equal(await vault.getPricePerFullShare(), '1000000000000000000');

        await vault.withdraw(40, {from: user});
        assert.equal(await token.balanceOf(vault.address), 80);
        assert.equal(await token.balanceOf(user), 40);
        assert.equal(await vault.balance(), 80);
        assert.equal(await vault.totalSupply(), 80);
        assert.equal(await vault.balanceOf(user), 80);
        assert.equal(await vault.getPricePerFullShare(), '1000000000000000000');

        await vault.withdrawAll({from: user});
        assert.equal(await token.balanceOf(vault.address), 0);
        assert.equal(await token.balanceOf(user), 120);
        assert.equal(await vault.balance(), 0);
        assert.equal(await vault.totalSupply(), 0);
        assert.equal(await vault.balanceOf(user), 0);
    });
    it("should be able to deposit all and withdraw all with dummy strategy", async () => {
        await vault.setStrategy(strategy.address);
        await token.mint(user, 120);
        await token.approve(vault.address, 120, {from: user});
        await vault.depositAll({from: user});
        assert.equal(await token.balanceOf(vault.address), 120);
        assert.equal(await token.balanceOf(user), 0);
        assert.equal(await vault.balance(), 120);
        assert.equal(await vault.totalSupply(), 120);
        assert.equal(await vault.balanceOf(user), 120);
        assert.equal(await vault.getPricePerFullShare(), '1000000000000000000');

        await vault.withdraw(40, {from: user});
        assert.equal(await token.balanceOf(vault.address), 80);
        assert.equal(await token.balanceOf(user), 40);
        assert.equal(await vault.balance(), 80);
        assert.equal(await vault.totalSupply(), 80);
        assert.equal(await vault.balanceOf(user), 80);
        assert.equal(await vault.getPricePerFullShare(), '1000000000000000000');

        await vault.withdrawAll({from: user});
        assert.equal(await token.balanceOf(vault.address), 0);
        assert.equal(await token.balanceOf(user), 120);
        assert.equal(await vault.balance(), 0);
        assert.equal(await vault.totalSupply(), 0);
        assert.equal(await vault.balanceOf(user), 0);
    });

    it("should be able to deposit into and withdraw from strategy", async () => {
        await vault.setStrategy(strategy.address);
        await token.mint(user, 200);
        await token.approve(vault.address, 200, {from: user});
        await vault.depositAll({from: user});
        // Deposit into strategy!
        await vault.earn();
        assert.equal(await vault.balance(), 200);
        assert.equal(await strategy.balanceOf(), 200);
        assert.equal(await token.balanceOf(vault.address), 0);
        assert.equal(await token.balanceOf(strategy.address), 200);

        // Harvest from strategy!
        await strategy.harvest();
        assert.equal(await vault.balance(), 240);
        assert.equal(await strategy.balanceOf(), 240);
        assert.equal(await token.balanceOf(vault.address), 0);
        assert.equal(await token.balanceOf(strategy.address), 240);
        assert.equal(await vault.getPricePerFullShare(), '1200000000000000000');

        // Withdraw from vault
        assert.equal(await vault.totalSupply(), 200);
        assert.equal(await vault.balanceOf(user), 200);
        assert.equal(await token.balanceOf(user), 0);
        await vault.withdraw(60, {from: user});
        assert.equal(await vault.totalSupply(), 140);
        assert.equal(await vault.balanceOf(user), 140);
        assert.equal(await vault.balance(), 168);
        assert.equal(await token.balanceOf(user), 72);
        assert.equal(await token.balanceOf(vault.address), 0);
        assert.equal(await token.balanceOf(strategy.address), 168);

        await vault.withdrawAll({from: user});
        assert.equal(await vault.totalSupply(), 0);
        assert.equal(await vault.balanceOf(user), 0);
        assert.equal(await vault.balance(), 0);
        assert.equal(await token.balanceOf(user), 240);
        assert.equal(await token.balanceOf(vault.address), 0);
        assert.equal(await token.balanceOf(strategy.address), 0);
    });
});