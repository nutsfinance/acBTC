const { expectRevert } = require('@openzeppelin/test-helpers');
const AccountFactory = artifacts.require("AccountFactory");
const Account = artifacts.require("Account");
const assert = require('assert');

let accountFactory;

contract("AccountFactory", async ([deployer, owner, admin1, admin2, admin3]) => {
    beforeEach(async () => {
        const account = await Account.new();
        accountFactory = await AccountFactory.new(account.address);
    });
    it("should be able to create new account", async () => {
        await accountFactory.createAccount([admin1, admin2], {from: owner});
        const account = await Account.at(await accountFactory.getAccount(owner));
        assert.equal(await account.owner(), owner);
        assert.equal(await account.admins(admin1), true);
        assert.equal(await account.admins(admin2), true);
        assert.equal(await account.admins(admin3), false);
    });
    it("should be able to create another account", async () => {
        await accountFactory.createAccount([admin1, admin2], {from: owner});
        const account1 = await Account.at(await accountFactory.getAccount(owner));
        await accountFactory.createAccount([admin1, admin3], {from: owner});
        const account2 = await Account.at(await accountFactory.getAccount(owner));
        assert.notEqual(account1, account2);
        assert.equal(await account2.owner(), owner);
        assert.equal(await account2.admins(admin1), true);
        assert.equal(await account2.admins(admin2), false);
        assert.equal(await account2.admins(admin3), true);
    });
});