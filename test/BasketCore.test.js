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

contract("BasketCore", ([owner, basketManager, user, user2, basketManager2, feeReceiver2, basketToken2]) => {
    beforeEach(async () => {
        basketCore = await BasketCore.new();
        basketToken = await BasketToken.new("Test Token", "TEST", basketCore.address);
        feeReceiver = await FeeReceiver.new();
        await basketCore.initialize(basketManager, feeReceiver.address, basketToken.address);
    });
    it("should be able to set basket manager by owner", async () => {
        assert.equal(await basketCore.getBasketManager(), basketManager);
        await basketCore.setBasketManager(basketManager2);
        assert.equal(await basketCore.getBasketManager(), basketManager2);
    }),
    it("should not allow to set basket manager other than owner", async () => {
        await expectRevert(basketCore.setBasketManager(basketManager2, {from: user}),
            "Ownable: caller is not the owner");
    });
    it("should be able to set fee receiver by owner", async () => {
        assert.equal(await basketCore.getFeeReceiver(), feeReceiver.address);
        await basketCore.setFeeReceiver(feeReceiver2);
        assert.equal(await basketCore.getFeeReceiver(), feeReceiver2);
    }),
    it("should not allow to set fee receiver other than owner", async () => {
        await expectRevert(basketCore.setFeeReceiver(feeReceiver2, {from: user}), 
            "Ownable: caller is not the owner");
    });
    it("should be able to set basket token by owner", async () => {
        assert.equal(await basketCore.getBasketToken(), basketToken.address);
        await basketCore.setBasketToken(basketToken2);
        assert.equal(await basketCore.getBasketToken(), basketToken2);
    }),
    it("should not allow to set basket token other than owner", async () => {
        await expectRevert(basketCore.setBasketToken(basketToken2, {from: user}), "Ownable: caller is not the owner");
    });
    it("should mint new basket token by basket manager", async () => {
        const mockToken = await MockToken.new("TEST", "TEST");
        await mockToken.mint(user, 2000, {from: user});
        await mockToken.approve(basketCore.address, 2000, {from: user});

        const prevSupply = await basketToken.totalSupply();
        const prevBalance1 = await basketToken.balanceOf(user);
        const prevBalance2 = await basketToken.balanceOf(feeReceiver.address);
        const prevBalance3 = await mockToken.balanceOf(user);
        await basketCore.mint(user, mockToken.address, 400, 5, {from: basketManager});
        const currSupply = await basketToken.totalSupply();
        const currBalance1 = await basketToken.balanceOf(user);
        const currBalance2 = await basketToken.balanceOf(feeReceiver.address);
        const currBalance3 = await mockToken.balanceOf(user);

        assert.equal(currSupply - prevSupply, 400);
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
    it("should swap underlying tokens by basket manager", async () => {
        const mockToken = await MockToken.new("TEST", "TEST");
        await mockToken.mint(user, 2000, {from: user});
        await mockToken.approve(basketCore.address, 1000, {from: user});
        await basketCore.mint(user, mockToken.address, 1000, 5, {from: basketManager});

        const mockToken2 = await MockToken.new("TEST2", "TEST2");
        await mockToken2.mint(user2, 1500, {from: user2});
        await mockToken2.approve(basketCore.address, 800, {from: user2});

        // User 2 swaps 800 mock token 2 to 780 mock token 1 with 20 fee
        const prevTokenBalance1 = await basketCore.getTokenBalance(mockToken.address);
        const prevTokenBalance2 = await basketCore.getTokenBalance(mockToken2.address);
        const prevBalance1 = await mockToken.balanceOf(user2);
        const prevBalance2 = await mockToken2.balanceOf(user2);
        const prevSupply = await basketToken.totalSupply();

        await basketCore.swap(user2, mockToken2.address, mockToken.address, 800, 20, {from: basketManager});
        const currTokenBalance1 = await basketCore.getTokenBalance(mockToken.address);
        const currTokenBalance2 = await basketCore.getTokenBalance(mockToken2.address);
        const currBalance1 = await mockToken.balanceOf(user2);
        const currBalance2 = await mockToken2.balanceOf(user2);
        const currSupply = await basketToken.totalSupply();
        assert.equal(currTokenBalance1 - prevTokenBalance1, -780);
        assert.equal(currTokenBalance2 - prevTokenBalance2, 800);
        assert.equal(currBalance1 - prevBalance1, 780);     // User2 receives 780 mock token 1
        assert.equal(currBalance2 - prevBalance2, -800);    // User2 pays 800 mock token 2
        assert.equal(currSupply - prevSupply, 20);          // 20 fee is minted to basket token
    });
    it("should not allow to swap underlying tokens other than basket manager", async () => {
        const mockToken = await MockToken.new("TEST", "TEST");
        await mockToken.mint(user, 2000, {from: user});
        await mockToken.approve(basketCore.address, 1000, {from: user});
        await basketCore.mint(user, mockToken.address, 1000, 5, {from: basketManager});

        const mockToken2 = await MockToken.new("TEST2", "TEST2");
        await mockToken2.mint(user2, 1500, {from: user2});
        await mockToken2.approve(basketCore.address, 800, {from: user2});

        // User 2 swaps 800 mock token 2 to 780 mock token 1 with 20 fee
        await expectRevert(basketCore.swap(user2, mockToken2.address, mockToken.address, 800, 20, {from: owner}),
            "BasketCore: The caller must be BasketManager contract");
    });
});