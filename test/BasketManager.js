const { expectRevert } = require('@openzeppelin/test-helpers');
const BasketManager = artifacts.require("BasketManager");
const BasketCore = artifacts.require("BasketCore");
const BasketToken = artifacts.require("BasketToken");
const FeeReceiver = artifacts.require("FeeReceiver");
const ERC20 = artifacts.require("MockToken");
const assert = require('assert');

let basketManager;
let basketCore;
let basketToken;
let feeReceiver;

contract("BasketManager", ([owner, user1, user2]) => {
    beforeEach(async () => {
        basketManager = await BasketManager.new();
        basketCore = await BasketCore.new();
        basketToken = await BasketToken.new("Test Token", "TEST", basketCore.address);
        feeReceiver = await FeeReceiver.new();
        await basketManager.initialize(basketCore.address);
        await basketCore.initialize(basketManager.address, feeReceiver.address, basketToken.address);
    });
    it('should allow to add new token by owner', async () => {
        const token = await ERC20.new("Test token", "test");
        await basketManager.addToken(token.address, {from: owner});
        const tokens = await basketManager.getTokens();
        assert.deepEqual(tokens, [token.address]);
        const tokenStatus = await basketManager.getTokenStatus(tokens[0]);
        assert.equal(tokenStatus.toNumber(), 1);
    });
    it('should not allow to add new token by other user', async () => {
        const token = await ERC20.new("Test token", "test");
        await expectRevert(basketManager.addToken(token.address, {from: user1}), "Ownable: caller is not the owner");
    });
    it('should allow pause token by owner', async () => {
        const token = await ERC20.new("Test token", "test");
        await basketManager.addToken(token.address, {from: owner});
        await basketManager.pauseToken(token.address, {from: owner});
        const tokens = await basketManager.getTokens();
        assert.deepEqual(tokens, [token.address]);
        const tokenStatus = await basketManager.getTokenStatus(tokens[0]);
        assert.equal(tokenStatus.toNumber(), 2);
    });
    it('should not allow to pause token by other user', async () => {
        const token = await ERC20.new("Test token", "test");
        await basketManager.addToken(token.address, {from: owner});
        await expectRevert(basketManager.pauseToken(token.address, {from: user1}), "Ownable: caller is not the owner");
    });
    it('should not allow to pause a paused token', async () => {
        const token = await ERC20.new("Test token", "test");
        await basketManager.addToken(token.address, {from: owner});
        await basketManager.pauseToken(token.address, {from: owner})
        await expectRevert(basketManager.pauseToken(token.address, {from: owner}), "BasketManager: Invalid token status");
    });
    it('should allow terminate token by owner', async () => {
        const token = await ERC20.new("Test token", "test");
        await basketManager.addToken(token.address, {from: owner});
        await basketManager.terminateToken(token.address, {from: owner});
        const tokens = await basketManager.getTokens();
        assert.deepEqual(tokens, [token.address]);
        const tokenStatus = await basketManager.getTokenStatus(tokens[0]);
        assert.equal(tokenStatus.toNumber(), 3);
    });
    it('should not allow to terminate token by other user', async () => {
        const token = await ERC20.new("Test token", "test");
        await basketManager.addToken(token.address, {from: owner});
        await expectRevert(basketManager.terminateToken(token.address, {from: user1}), "Ownable: caller is not the owner");
    });
    it('should allow terminate a paused token', async () => {
        const token = await ERC20.new("Test token", "test");
        await basketManager.addToken(token.address, {from: owner});
        await basketManager.pauseToken(token.address, {from: owner});
        await basketManager.terminateToken(token.address, {from: owner});
        const tokens = await basketManager.getTokens();
        assert.deepEqual(tokens, [token.address]);
        const tokenStatus = await basketManager.getTokenStatus(tokens[0]);
        assert.equal(tokenStatus.toNumber(), 3);
    });
    it('should not allow to pause a terminated token', async () => {
        const token = await ERC20.new("Test token", "test");
        await basketManager.addToken(token.address, {from: owner});
        await basketManager.terminateToken(token.address, {from: owner})
        await expectRevert(basketManager.pauseToken(token.address, {from: owner}), "BasketManager: Invalid token status");
    });
    it('should not allow to terminate a terminated token', async () => {
        const token = await ERC20.new("Test token", "test");
        await basketManager.addToken(token.address, {from: owner});
        await basketManager.terminateToken(token.address, {from: owner})
        await expectRevert(basketManager.terminateToken(token.address, {from: owner}), "BasketManager: Invalid token status");
    });
    it('should allow to mint new tokens', async () => {
        const token = await ERC20.new("Test token", "test");
        await basketManager.addToken(token.address, {from: owner});
        await token.mint(user1, 10000);
        await token.approve(basketCore.address, 10000, {from: user1});
        const prevBalance = await basketToken.balanceOf(user1);
        const prevCoreBalance = await basketCore.getTokenBalance(token.address);
        await basketManager.mint([token.address], [10000], {from: user1});
        const currBalance = await basketToken.balanceOf(user1);
        const currCoreBalance = await basketCore.getTokenBalance(token.address);
        assert.equal(currBalance - prevBalance, 10000);
        assert.equal(currCoreBalance - prevCoreBalance, 10000);

    });
    it('should not allow to mint with paused tokens', async () => {
        const token = await ERC20.new("Test token", "test");
        await basketManager.addToken(token.address, {from: owner});
        await basketManager.pauseToken(token.address, {from: owner});
        await token.mint(user1, 10000);
        await token.approve(basketCore.address, 10000, {from: user1});
        await expectRevert(basketManager.mint([token.address], [10000], {from: user1}), "BasketManager: Invalid token status");

    });
    it('should allow to mint with unpaused tokens', async () => {
        const token = await ERC20.new("Test token", "test");
        await basketManager.addToken(token.address, {from: owner});
        await basketManager.pauseToken(token.address, {from: owner});
        await token.mint(user1, 10000);
        await token.approve(basketCore.address, 10000, {from: user1});
        const prevBalance = await basketToken.balanceOf(user1);
        const prevCoreBalance = await basketCore.getTokenBalance(token.address);
        await basketManager.unpauseToken(token.address, {from: owner});
        await basketManager.mint([token.address], [10000], {from: user1});
        const currBalance = await basketToken.balanceOf(user1);
        const currCoreBalance = await basketCore.getTokenBalance(token.address);
        assert.equal(currBalance - prevBalance, 10000);
        assert.equal(currCoreBalance - prevCoreBalance, 10000);
    });
    it('should not allow to mint with terminated tokens', async () => {
        const token = await ERC20.new("Test token", "test");
        await basketManager.addToken(token.address, {from: owner});
        await basketManager.terminateToken(token.address, {from: owner});
        await token.mint(user1, 10000);
        await token.approve(basketCore.address, 10000, {from: user1});
        await expectRevert(basketManager.mint([token.address], [10000], {from: user1}), "BasketManager: Invalid token status");

    });
    it('should allow redeem basket tokens', async () => {
        const token1 = await ERC20.new("Test token 1", "test1");
        await basketManager.addToken(token1.address, {from: owner});
        await token1.mint(user1, 10000);
        await token1.approve(basketCore.address, 10000, {from: user1});

        const token2 = await ERC20.new("Test token 2", "test2");
        await basketManager.addToken(token2.address, {from: owner});
        await token2.mint(user1, 10000);
        await token2.approve(basketCore.address, 10000, {from: user1});

        const prevBalance = await basketToken.balanceOf(user1);
        await basketManager.mint([token1.address], [10000], {from: user1});
        await basketManager.mint([token2.address], [5000], {from: user1});
        const currBalance = await basketToken.balanceOf(user1);
        assert.equal(currBalance - prevBalance, 15000);

        // Transfer acBTC to user2
        await basketToken.transfer(user2, 12000, {from: user1});
        await basketToken.approve(basketCore.address, 9000, {from: user2});
        const prevSupply = await basketToken.totalSupply();
        const prevBalance1 = await token1.balanceOf(user2);
        const prevBalance2 = await token2.balanceOf(user2);
        const prevBalance3 = await basketToken.balanceOf(user2);

        await basketManager.redeem(9000, {from: user2});
        const currSupply = await basketToken.totalSupply();
        const currBalance1 = await token1.balanceOf(user2);
        const currBalance2 = await token2.balanceOf(user2);
        const currBalance3 = await basketToken.balanceOf(user2);

        assert.equal(prevSupply - currSupply, 9000);
        assert.equal(currBalance1 - prevBalance1, 6000);
        assert.equal(currBalance2 - prevBalance2, 3000);
        assert.equal(prevBalance3 - currBalance3, 9000);
    });
    it('should allow redeem basket tokens to paused tokens', async () => {
        const token1 = await ERC20.new("Test token 1", "test1");
        await basketManager.addToken(token1.address, {from: owner});
        await token1.mint(user1, 10000);
        await token1.approve(basketCore.address, 10000, {from: user1});

        const token2 = await ERC20.new("Test token 2", "test2");
        await basketManager.addToken(token2.address, {from: owner});
        await token2.mint(user1, 10000);
        await token2.approve(basketCore.address, 10000, {from: user1});

        const prevBalance = await basketToken.balanceOf(user1);
        await basketManager.mint([token1.address], [10000], {from: user1});
        await basketManager.mint([token2.address], [5000], {from: user1});
        const currBalance = await basketToken.balanceOf(user1);
        assert.equal(currBalance - prevBalance, 15000);

        // Pause token 2
        await basketManager.pauseToken(token2.address, {from: owner});

        // Transfer acBTC to user2
        await basketToken.transfer(user2, 12000, {from: user1});
        await basketToken.approve(basketCore.address, 9000, {from: user2});
        const prevBalance1 = await token1.balanceOf(user2);
        const prevBalance2 = await token2.balanceOf(user2);
        const prevBalance3 = await basketToken.balanceOf(user2);
        const prevSupply = await basketToken.totalSupply();

        await basketManager.redeem(9000, {from: user2});
        const currBalance1 = await token1.balanceOf(user2);
        const currBalance2 = await token2.balanceOf(user2);
        const currBalance3 = await basketToken.balanceOf(user2);
        const currSupply = await basketToken.totalSupply();

        assert.equal(prevSupply - currSupply, 9000);
        assert.equal(currBalance1 - prevBalance1, 6000);
        assert.equal(currBalance2 - prevBalance2, 3000);
        assert.equal(prevBalance3 - currBalance3, 9000);
    });
    it('should allow redeem basket tokens to terminated tokens', async () => {
        const token1 = await ERC20.new("Test token 1", "test1");
        await basketManager.addToken(token1.address, {from: owner});
        await token1.mint(user1, 10000);
        await token1.approve(basketCore.address, 10000, {from: user1});

        const token2 = await ERC20.new("Test token 2", "test2");
        await basketManager.addToken(token2.address, {from: owner});
        await token2.mint(user1, 10000);
        await token2.approve(basketCore.address, 10000, {from: user1});

        const prevBalance = await basketToken.balanceOf(user1);
        await basketManager.mint([token1.address], [10000], {from: user1});
        await basketManager.mint([token2.address], [5000], {from: user1});
        const currBalance = await basketToken.balanceOf(user1);
        assert.equal(currBalance - prevBalance, 15000);

        // Terminate token 2
        await basketManager.terminateToken(token2.address, {from: owner});

        // Transfer acBTC to user2
        await basketToken.transfer(user2, 12000, {from: user1});
        await basketToken.approve(basketCore.address, 9000, {from: user2});
        const prevBalance1 = await token1.balanceOf(user2);
        const prevBalance2 = await token2.balanceOf(user2);
        const prevBalance3 = await basketToken.balanceOf(user2);
        const prevSupply = await basketToken.totalSupply();

        await basketManager.redeem(9000, {from: user2});
        const currBalance1 = await token1.balanceOf(user2);
        const currBalance2 = await token2.balanceOf(user2);
        const currBalance3 = await basketToken.balanceOf(user2);
        const currSupply = await basketToken.totalSupply();

        assert.equal(prevSupply - currSupply, 9000);
        assert.equal(currBalance1 - prevBalance1, 6000);
        assert.equal(currBalance2 - prevBalance2, 3000);
        assert.equal(prevBalance3 - currBalance3, 9000);
    });
});