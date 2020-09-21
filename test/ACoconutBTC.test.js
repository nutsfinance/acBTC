const { expectRevert } = require('@openzeppelin/test-helpers');
const ACoconutBTC = artifacts.require("ACoconutBTC");
const assert = require('assert');

contract('ACoconutBTC', async ([owner, minter1, minter2, user1, user2]) => {
    let aCoconutBTC;
    beforeEach(async () => {
        aCoconutBTC = await ACoconutBTC.new();
    });
    it("should set governance", async () => {
        assert.equal(await aCoconutBTC.governance(), owner);
        await expectRevert(aCoconutBTC.setGovernance(user2, {from: user1}), "not governance");
        await aCoconutBTC.setGovernance(user1);
        assert.equal(await aCoconutBTC.governance(), user1);
    });
    it("should be able to set minters by governance", async () => {
        assert.equal(await aCoconutBTC.minters(minter1), false);
        await aCoconutBTC.setMinter(minter1, true);
        assert.equal(await aCoconutBTC.minters(minter1), true);
    });
    it("should not allow to set minter other than governance", async () => {
        await expectRevert(aCoconutBTC.setMinter(minter1, true, {from: user1}), "not governance");
    });
    it("should allow minters to mint and burn", async () => {
        await aCoconutBTC.setMinter(minter1, true);
        await aCoconutBTC.mint(user1, 1000, {from: minter1});
        assert.equal(await aCoconutBTC.balanceOf(user1), 1000);
        await aCoconutBTC.burn(user1, 200, {from: minter1});
        assert.equal(await aCoconutBTC.balanceOf(user1), 800);
    });
    it("should not allow to mint or burn other than minters", async () => {
        await expectRevert(aCoconutBTC.mint(user1, 1000, {from: minter1}), "not minter");
        await expectRevert(aCoconutBTC.burn(user1, 200, {from: minter1}), "not minter");
    });
});