const { expectRevert } = require('@openzeppelin/test-helpers');
const FeeReceiver = artifacts.require("FeeReceiver");
const MockToken = artifacts.require("MockToken");
const assert = require('assert');

let feeReceiver;
let token;

contract("FeeReceiver", ([owner, admin, user]) => {
    beforeEach(async () => {
        feeReceiver = await FeeReceiver.new();
        token = await MockToken.new("TEST", "TEST");
        await token.mint(feeReceiver.address, 2000);
    });
    it("should allow owner to withdraw tokens", async () => {
        await feeReceiver.withdrawToken(token.address, 800);
        assert.equal(await token.balanceOf(owner), 800);
    });
    it("should allow admin to withdraw tokens", async () => {
        await feeReceiver.grantRole(web3.utils.sha3("ADMIN_ROLE"), admin);
        await feeReceiver.withdrawToken(token.address, 800, {from: admin});
        assert.equal(await token.balanceOf(admin), 800);
    });
    it("should not allow non-admin to withdraw tokens", async () => {
        await expectRevert(feeReceiver.withdrawToken(token.address, 800, {from: user}),
            "FeeReceiver: Caller is not an admin");
    });
});