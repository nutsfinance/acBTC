const { expectRevert } = require('@openzeppelin/test-helpers');
const Account = artifacts.require("Account");
const assert = require('assert');
const MockToken = artifacts.require("MockWBTC");

let account;
let token;

contract("Account", async ([deployer, owner, user, user2, admin1, admin2, admin3]) => {
    beforeEach(async () => {
        account = await Account.new();
        await account.initialize(owner, [admin1, admin2]);
        token = await MockToken.new();
    });
    it("shoud initialize owner and admins", async () => {
        assert.equal(await account.owner(), owner);
        assert.equal(await account.admins(admin1), true);
        assert.equal(await account.admins(admin2), true);
        assert.equal(await account.admins(admin3), false);
    });
    it('should be able to transfer ownership', async () => {
        await account.transferOwnership(user, {from: owner});
        assert.equal(await account.owner(), user);
    });
    it('should not able to transfer ownership other than owner', async () => {
        await expectRevert(account.transferOwnership(user2, {from: user}), "not owner");
    });
    it("should allow to grant admin role by owner", async () => {
        assert.equal(await account.admins(user), false);
        await account.grantAdmin(user, {from: owner});
        assert.equal(await account.admins(user), true);
    });
    it("should not allow to grant admin role other than owner", async () => {
        await expectRevert(account.grantAdmin(user, {from: admin1}), "not owner");
    });
    it("should allow to revoke admin role by owner", async () => {
        assert.equal(await account.admins(admin1), true);
        await account.revokeAdmin(admin1, {from: owner});
        assert.equal(await account.admins(admin1), false);
    });
    it("should not allow to revoke admin role other than owner", async () => {
        await expectRevert(account.revokeAdmin(admin2, {from: admin1}), "not owner");
    });
    it("should allow to grant operator role by admin", async () => {
        assert.equal(await account.operators(user), false);
        await account.grantOperator(user, {from: admin1});
        assert.equal(await account.operators(user), true);
    });
    it("should not allow to grant operator role other than admin", async () => {
        await expectRevert(account.grantOperator(user, {from: user2}), "not admin");
    });
    it("should allow to revoke operator role by admin", async () => {
        assert.equal(await account.operators(user), false);
        await account.grantOperator(user, {from: admin1});
        assert.equal(await account.operators(user), true);
        await account.revokeOperator(user, {from: admin1});
        assert.equal(await account.operators(user), false);
    });
    it("should not allow to revoke operator role other than admin", async () => {
        await account.grantOperator(user, {from: admin1});
        await expectRevert(account.revokeOperator(user, {from: user2}), "not admin");
    });
    it("should allow to withdraw ETH by operator", async () => {
        await account.send(100000000000000000);  // 0.1 ETH
        await account.grantOperator(user, {from: admin1});
        const prevBalance = await web3.eth.getBalance(user2);
        await account.withdraw(user2, "100000000000000000", {from: user});
        const currBalance = await web3.eth.getBalance(user2);
        assert.equal(currBalance - prevBalance, 100000000000000000);
    });
    it("should not allow to withdraw ETH other than operator", async () => {
        await account.send(100000000000000000);  // 0.1 ETH
        await expectRevert(account.withdraw(user2, "100000000000000000", {from: user}), "not operator");
    });
    it("should allow to withdraw ERC20 by operator", async () => {
        await token.mint(account.address, 10000);
        await account.grantOperator(user, {from: admin1});
        const prevBalance = await token.balanceOf(user2);
        await account.withdrawToken(token.address, user2, "8000", {from: user});
        const currBalance = await token.balanceOf(user2);
        assert.equal(currBalance - prevBalance, 8000);
    });
    it("should not allow to withdraw ERC20 other than operator", async () => {
        await token.mint(account.address, 10000);
        await expectRevert(account.withdrawToken(token.address, user2, "8000", {from: user}), "not operator");
    });
    it("should allow to withdraw ERC20 without fallthrough by operator", async () => {
        await token.mint(account.address, 10000);
        await account.grantOperator(user, {from: admin1});
        const prevBalance = await token.balanceOf(user2);
        await account.withdrawTokenFallThrough(token.address, user2, "8000", {from: user});
        const currBalance = await token.balanceOf(user2);
        assert.equal(currBalance - prevBalance, 8000);
    });
    it("should allow to withdraw ERC20 with fallthrough by operator", async () => {
        await token.mint(account.address, 5000);
        await token.mint(owner, 10000);
        await token.approve(account.address, 3000, {from: owner});
        await account.grantOperator(user, {from: admin1});
        const prevBalance = await token.balanceOf(user2);
        // Withdraws 5000 from account, 3000 from owner address
        await account.withdrawTokenFallThrough(token.address, user2, "8000", {from: user});
        const currBalance = await token.balanceOf(user2);
        assert.equal(currBalance - prevBalance, 8000);
    });
    it("should not allow to withdraw ERC20 with fallthrough other than operator", async () => {
        await token.mint(account.address, 5000);
        await token.mint(owner, 10000);
        await token.approve(account.address, 3000, {from: owner});
        // Withdraws 5000 from account, 3000 from owner address
        await expectRevert(account.withdrawTokenFallThrough(token.address, user2, "8000", {from: user}),
            "not operator");
    });
    it("should not allow to withdraw ERC20 with fallthrough without sufficient allowance", async () => {
        await token.mint(account.address, 5000);
        await token.mint(owner, 10000);
        await token.approve(account.address, 2000, {from: owner});
        await account.grantOperator(user, {from: admin1});
        // Withdraws 5000 from account, 3000 from owner address
        await expectRevert(account.withdrawTokenFallThrough(token.address, user2, "8000", {from: user}),
            "ERC20: transfer amount exceeds allowance");
    });
    it("should allow to set ERC20 allowance by operator", async () => {
        await account.grantOperator(user, {from: admin1});
        await account.approveToken(token.address, user2, "8000", {from: user});
        const allowance = await token.allowance(account.address, user2);
        assert.equal(allowance, 8000);
    });
    it("should not allow to set ERC20 allowance other than operator", async () => {
        await expectRevert(account.approveToken(token.address, user2, "8000", {from: user}),
            "not operator");
    });
    it("should allow to set ERC20 allowance with transaction data by operator", async () => {
        await account.grantOperator(user, {from: admin1});
        const data = web3.eth.abi.encodeFunctionCall({
            name: 'approve',
            type: 'function',
            inputs: [{
                type: 'address',
                name: 'spenderAddress'
            },{
                type: 'uint256',
                name: 'amount'
            }]
        }, [user2, "5000"]);
        await account.invoke(token.address, 0, data, {from: user});
        const allowance = await token.allowance(account.address, user2);
        assert.equal(allowance, 5000);
    });
    it("should not allow to set ERC20 allowance with transaction data other than operator", async () => {
        const data = web3.eth.abi.encodeFunctionCall({
            name: 'approve',
            type: 'function',
            inputs: [{
                type: 'address',
                name: 'spenderAddress'
            },{
                type: 'uint256',
                name: 'amount'
            }]
        }, [user2, "5000"]);
        await expectRevert(account.invoke(token.address, 0, data, {from: user}), "not operator");
    });
});