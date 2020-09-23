const { expectRevert } = require('@openzeppelin/test-helpers');
const ACoconut = artifacts.require("ACoconut");
const assert = require('assert');

contract('ACoconut', async ([owner, minter1, minter2, user1, user2]) => {
    let aCoconut;
    beforeEach(async () => {
        aCoconut = await ACoconut.new();
    });
    it("should set parameters", async () => {
        assert.equal(await aCoconut.name(), "ACoconut");
        assert.equal(await aCoconut.symbol(), "AC");
        assert.equal(await aCoconut.cap(), web3.utils.toWei('21000000'));
    });
    it("should set governance", async () => {
        assert.equal(await aCoconut.governance(), owner);
        await expectRevert(aCoconut.setGovernance(user2, {from: user1}), "not governance");
        await aCoconut.setGovernance(user1);
        assert.equal(await aCoconut.governance(), user1);
    });
    it("should be able to set minters by governance", async () => {
        assert.equal(await aCoconut.minters(minter1), false);
        await aCoconut.setMinter(minter1, true);
        assert.equal(await aCoconut.minters(minter1), true);
    });
    it("should not allow to set minter other than governance", async () => {
        await expectRevert(aCoconut.setMinter(minter1, true, {from: user1}), "not governance");
    });
    it("should allow minters to mint and burn", async () => {
        await aCoconut.setMinter(minter1, true);
        await aCoconut.mint(user1, 1000, {from: minter1});
        assert.equal(await aCoconut.balanceOf(user1), 1000);
        await aCoconut.burn(200, {from: user1});
        assert.equal(await aCoconut.balanceOf(user1), 800);
    });
});