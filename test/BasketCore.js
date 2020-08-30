const { expectRevert } = require('@openzeppelin/test-helpers');
const BasketToken = artifacts.require("BasketToken");
const BasketCore = artifacts.require("BasketCore");
const FeeReceiver = artifacts.require("FeeReceiver");
const MockToken = artifacts.require("MockToken");
const assert = require('assert');
const { expect } = require('chai');

let basketToken;
let basketCore;
let feeReceiver;

contract("BasketCore", ([owner, basketManager, user, user2]) => {
    beforeEach(async () => {
        basketCore = await BasketCore.new();
        basketToken = await BasketToken.new("Test Token", "TEST", basketCore.address);
        feeReceiver = await FeeReceiver.new();
        await basketCore.initialize(basketManager, feeReceiver.address, basketToken.address);
    });
    it("should mint new basket token by basket manager", async () => {
        const mockToken = await MockToken.new("TEST", "TEST");
        await mockToken.mint(user, 2000, {from: user});
        await mockToken.approve(basketCore.address, 2000, {from: user});

        const prevBalance1 = await basketToken.balanceOf(user);
        const prevBalance2 = await basketToken.balanceOf(feeReceiver.address);
        const prevBalance3 = await mockToken.balanceOf(user);
        await basketCore.mint(user, mockToken.address, 400, 5, {from: basketManager});
        const currBalance1 = await basketToken.balanceOf(user);
        const currBalance2 = await basketToken.balanceOf(feeReceiver.address);
        const currBalance3 = await mockToken.balanceOf(user);

        assert.equal(currBalance1 - prevBalance1, 395);
        assert.equal(currBalance2 - prevBalance2, 5);
        assert.equal(prevBalance3 - currBalance3, 400);
    });
    it('should not allow mint other than basket manager', async () => {
        const mockToken = await MockToken.new("TEST", "TEST");
        await mockToken.mint(user, 2000, {from: user});
        await mockToken.approve(basketCore.address, 2000, {from: user});
        
        await expectRevert(basketCore.mint(user, mockToken.address, 400, 5, {from: owner}),
            "BasketCore: The caller must be BasketManager contract");
    });
    it("should burn basket token by basket manager", async () => {
        const mockToken = await MockToken.new("TEST", "TEST");
        await mockToken.mint(user, 2000, {from: user});
        await mockToken.approve(basketCore.address, 2000, {from: user});

        await basketCore.mint(user, mockToken.address, 400, 5, {from: basketManager});
        await basketToken.transfer(user2, 200, {from: user});

        const prevSupply = await basketToken.totalSupply();
        const prevBalance1 = await basketToken.balanceOf(user2);
        const prevBalance2 = await basketToken.balanceOf(feeReceiver.address);
        const prevBalance3 = await mockToken.balanceOf(user2);
        await basketToken.approve(basketCore.address, 150, {from: user2});
        await basketCore.redeem(user2, mockToken.address, 150, 15, {from: basketManager});
        const currSupply = await basketToken.totalSupply();
        const currBalance1 = await basketToken.balanceOf(user2);
        const currBalance2 = await basketToken.balanceOf(feeReceiver.address);
        const currBalance3 = await mockToken.balanceOf(user2);

        // 15 basket tokens are paid as fee.
        assert.equal(prevSupply - currSupply, 135);
        assert.equal(prevBalance1 - currBalance1, 150);
        assert.equal(currBalance2 - prevBalance2, 15);
        assert.equal(currBalance3 - prevBalance3, 135);
    });
    it("should not allow burn basket token other than basket manager", async () => {
        const mockToken = await MockToken.new("TEST", "TEST");
        await mockToken.mint(user, 2000, {from: user});
        await mockToken.approve(basketCore.address, 2000, {from: user});

        await basketCore.mint(user, mockToken.address, 400, 5, {from: basketManager});
        await basketToken.transfer(user2, 200, {from: user});

        await basketToken.approve(basketCore.address, 150, {from: user2});
        await expectRevert(basketCore.redeem(user2, mockToken.address, 150, 15, {from: owner}),
            "BasketCore: The caller must be BasketManager contract");
    });
});