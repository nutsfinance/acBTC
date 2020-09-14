const { expectRevert } = require('@openzeppelin/test-helpers');
const AccountFactory = artifacts.require("AccountFactory");
const Account = artifacts.require("Account");
const assert = require('assert');

let accountFactory;

contract("AccountFactory", async ([deployer, owner, admin1, admin2]) => {
    beforeEach(async () => {
        accountFactory = await AccountFactory.new();
    });
    it("should be able to create new account", async () => {
        await accountFactory.createAccount([admin1, admin2], {from: owner});
        const account = await Account.at(await accountFactory.getAccount(owner));
        assert.equal(await account.hasRole(web3.utils.sha3("OWNER_ROLE"), owner), true);
        assert.equal(await account.hasRole(web3.utils.sha3("OWNER_ROLE"), deployer), false);
    });
    it("should be able to create another account", async () => {
        await accountFactory.createAccount([admin1, admin2], {from: owner});
        const account1 = await Account.at(await accountFactory.getAccount(owner));
        await accountFactory.createAccount([admin1, admin2], {from: owner});
        const account2 = await Account.at(await accountFactory.getAccount(owner));
        assert.notEqual(account1, account2);
        assert.equal(await account2.hasRole(web3.utils.sha3("OWNER_ROLE"), owner), true);
        assert.equal(await account2.hasRole(web3.utils.sha3("OWNER_ROLE"), deployer), false);
    });
});