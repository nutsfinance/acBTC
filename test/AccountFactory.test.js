const { expectRevert } = require('@openzeppelin/test-helpers');
const AccountFactory = artifacts.require("AccountFactory");
const Account = artifacts.require("Account");
const assert = require('assert');

let accountFactory;
let account;
contract("AccountFactory", async ([deployer, owner, admin1, admin2, admin3, user1]) => {
    beforeEach(async () => {
        account = await Account.new();
        accountFactory = await AccountFactory.new(account.address);
    });
    it("shoud initialize governance and account base", async () => {
        assert.strictEqual(await accountFactory.governance(), deployer);
        assert.strictEqual(await accountFactory.accountBase(), account.address);
    });
    it("should set governance", async () => {
        assert.strictEqual(await accountFactory.governance(), deployer);
        await expectRevert(accountFactory.setGovernance(owner, {from: admin1}), "not governance");
        await accountFactory.setGovernance(owner);
        assert.strictEqual(await accountFactory.governance(), owner);
    });
    it("should be able to set account base by governance", async () => {
        const account2 = await Account.new();
        await accountFactory.setAccountBase(account2.address);
        assert.strictEqual(await accountFactory.accountBase(), account2.address);
    });
    it("should not be able to set account base other than governance", async () => {
        const account2 = await Account.new();
        await expectRevert(accountFactory.setAccountBase(account2.address, {from: admin1}), "not governance");
    });
    it("should be able to create new account", async () => {
        await accountFactory.createAccount([admin1, admin2], {from: owner});
        const account = await Account.at(await accountFactory.accounts(owner));
        assert.strictEqual(await account.owner(), owner);
        assert.strictEqual(await account.admins(admin1), true);
        assert.strictEqual(await account.admins(admin2), true);
        assert.strictEqual(await account.admins(admin3), false);
    });
    it("should be able to create another account", async () => {
        await accountFactory.createAccount([admin1, admin2], {from: user1});
        const account1 = await Account.at(await accountFactory.accounts(user1));
        await accountFactory.createAccount([admin1, admin3], {from: user1});
        const account2 = await Account.at(await accountFactory.accounts(user1));
        assert.notStrictEqual(account1, account2);
        assert.strictEqual(await account2.owner(), user1);
        assert.strictEqual(await account2.admins(admin1), true);
        assert.strictEqual(await account2.admins(admin2), false);
        assert.strictEqual(await account2.admins(admin3), true);
    });
});