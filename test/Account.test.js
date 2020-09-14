const { expectRevert } = require('@openzeppelin/test-helpers');
const Account = artifacts.require("Account");
const assert = require('assert');
const MockToken = artifacts.require("MockToken");

let account;
let token;

contract("Account", async ([deployer, owner, user, user2, admin1, admin2, admin3]) => {
    beforeEach(async () => {
        account = await Account.new(owner, [admin1, admin2]);
        token = await MockToken.new("TEST", "TEST");
    });
    it("shoud initialize owner and admins", async () => {
        assert.equal(await account.hasRole(web3.utils.sha3("OWNER_ROLE"), owner), true);
        assert.equal(await account.hasRole(web3.utils.sha3("OWNER_ROLE"), user), false);
        assert.equal(await account.hasRole(web3.utils.sha3("ADMIN_ROLE"), admin1), true);
        assert.equal(await account.hasRole(web3.utils.sha3("ADMIN_ROLE"), admin2), true);
        assert.equal(await account.hasRole(web3.utils.sha3("ADMIN_ROLE"), admin3), false);
    });
    it("should allow to grant admin role by owner", async () => {
        assert.equal(await account.hasRole(web3.utils.sha3("ADMIN_ROLE"), user), false);
        await account.grantRole(web3.utils.sha3("ADMIN_ROLE"), user, {from: owner});
        assert.equal(await account.hasRole(web3.utils.sha3("ADMIN_ROLE"), user), true);
    });
    it("should not allow to grant admin role other than owner", async () => {
        await expectRevert(account.grantRole(web3.utils.sha3("ADMIN_ROLE"), user, {from: admin1}),
            "AccessControl: sender must be an admin to grant");
    });
    it("should allow to grant operator role by admin", async () => {
        assert.equal(await account.hasRole(web3.utils.sha3("OPERATOR_ROLE"), user), false);
        await account.grantRole(web3.utils.sha3("OPERATOR_ROLE"), user, {from: admin1});
        assert.equal(await account.hasRole(web3.utils.sha3("OPERATOR_ROLE"), user), true);
    });
    it("should not allow to grant operator role other than admin", async () => {
        await expectRevert(account.grantRole(web3.utils.sha3("OPERATOR_ROLE"), user, {from: user2}),
            "AccessControl: sender must be an admin to grant");
    });
    it("should allow to withdraw ETH by operator", async () => {
        await account.send(100000000000000000);  // 0.1 ETH
        await account.grantRole(web3.utils.sha3("OPERATOR_ROLE"), user, {from: admin1});
        const prevBalance = await web3.eth.getBalance(user2);
        await account.withdraw(user2, "100000000000000000", {from: user});
        const currBalance = await web3.eth.getBalance(user2);
        assert.equal(currBalance - prevBalance, 100000000000000000);
    });
    it("should not allow to withdraw ETH other than operator", async () => {
        await account.send(100000000000000000);  // 0.1 ETH
        await expectRevert(account.withdraw(user2, "100000000000000000", {from: user}),
            "Account: Caller is not an operator");
    });
    it("should allow to withdraw ERC20 by operator", async () => {
        await token.mint(account.address, 10000);
        await account.grantRole(web3.utils.sha3("OPERATOR_ROLE"), user, {from: admin1});
        const prevBalance = await token.balanceOf(user2);
        await account.withdrawToken(token.address, user2, "8000", {from: user});
        const currBalance = await token.balanceOf(user2);
        assert.equal(currBalance - prevBalance, 8000);
    });
    it("should not allow to withdraw ERC20 other than operator", async () => {
        await token.mint(account.address, 10000);
        await expectRevert(account.withdrawToken(token.address, user2, "8000", {from: user}),
            "Account: Caller is not an operator");
    });
    it("should allow to withdraw ERC20 without fallthrough by operator", async () => {
        await token.mint(account.address, 10000);
        await account.grantRole(web3.utils.sha3("OPERATOR_ROLE"), user, {from: admin1});
        const prevBalance = await token.balanceOf(user2);
        await account.withdrawTokenFallThrough(token.address, user2, "8000", {from: user});
        const currBalance = await token.balanceOf(user2);
        assert.equal(currBalance - prevBalance, 8000);
    });
    it("should allow to withdraw ERC20 with fallthrough by operator", async () => {
        await token.mint(account.address, 5000);
        await token.mint(owner, 10000);
        await token.approve(account.address, 3000, {from: owner});
        await account.grantRole(web3.utils.sha3("OPERATOR_ROLE"), user, {from: admin1});
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
            "Account: Caller is not an operator");
    });
    it("should not allow to withdraw ERC20 with fallthrough without sufficient allowance", async () => {
        await token.mint(account.address, 5000);
        await token.mint(owner, 10000);
        await token.approve(account.address, 2000, {from: owner});
        await account.grantRole(web3.utils.sha3("OPERATOR_ROLE"), user, {from: admin1});
        // Withdraws 5000 from account, 3000 from owner address
        await expectRevert(account.withdrawTokenFallThrough(token.address, user2, "8000", {from: user}),
            "ERC20: transfer amount exceeds allowance");
    });
    it("should allow to set ERC20 allowance by operator", async () => {
        await account.grantRole(web3.utils.sha3("OPERATOR_ROLE"), user, {from: admin1});
        await account.approveToken(token.address, user2, "8000", {from: user});
        const allowance = await token.allowance(account.address, user2);
        assert.equal(allowance, 8000);
    });
    it("should not allow to set ERC20 allowance other than operator", async () => {
        await expectRevert(account.approveToken(token.address, user2, "8000", {from: user}),
            "Account: Caller is not an operator");
    });
    it("should allow to set ERC20 allowance with transaction data by operator", async () => {
        await account.grantRole(web3.utils.sha3("OPERATOR_ROLE"), user, {from: admin1});
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
        await expectRevert(account.invoke(token.address, 0, data, {from: user}),
            "Account: Caller is not an operator");
    });
});