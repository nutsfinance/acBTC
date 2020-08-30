const { expectRevert } = require('@openzeppelin/test-helpers');
const BasketToken = artifacts.require("BasketToken");
const assert = require('assert');

let basketToken;
contract("BasketToken", ([owner, basketCore, user]) => {
    beforeEach(async () => {
        basketToken = await BasketToken.new("Test Token", "TEST", basketCore);
    });
    it("should mint additional tokens by basket core", async () => {
        const prevBalance = await basketToken.balanceOf(user);
        await basketToken.mint(user, 1000, {from: basketCore});
        const currBalance = await basketToken.balanceOf(user);
        assert.equal(currBalance - prevBalance, 1000);
    });
    it("should not allow mint other than basket core", async () => {
        await expectRevert(basketToken.mint(user, 1000, {from: owner}), "BasketToken: The caller must be BasketCore contract");
    });
    it("should burn tokens by basket core", async () => {
        await basketToken.mint(user, 1000, {from: basketCore});
        const prevBalance = await basketToken.balanceOf(user);
        await basketToken.burn(user, 300, {from: basketCore});
        const currBalance = await basketToken.balanceOf(user);
        assert.equal(prevBalance - currBalance, 300);
    });
    it("should not allow mint other than basket core", async () => {
        await basketToken.mint(user, 1000, {from: basketCore});
        await expectRevert(basketToken.burn(user, 300, {from: owner}), "BasketToken: The caller must be BasketCore contract");
    });
});