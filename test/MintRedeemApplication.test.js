const { expectRevert } = require('@openzeppelin/test-helpers');
const AccountFactory = artifacts.require("AccountFactory");
const Account = artifacts.require("Account");
const MintRedeemApplication = artifacts.require("MintRedeemApplication");
const BasketManager = artifacts.require("BasketManager");
const BasketCore = artifacts.require("BasketCore");
const BasketToken = artifacts.require("BasketToken");
const FeeReceiver = artifacts.require("FeeReceiver");
const MockToken = artifacts.require("MockToken");
const assert = require('assert');

let mintRedeemApplication;
let accountFactory
let basketManager;
let basketCore;
let basketToken;
let feeReceiver;
let token1;
let token2;
let account;
let account2;

contract("MintRedeemApplication", ([owner, user, user2, user3]) => {
    beforeEach(async () => {
        basketManager = await BasketManager.new();
        basketCore = await BasketCore.new();
        basketToken = await BasketToken.new("Test Token", "TEST", basketCore.address);
        feeReceiver = await FeeReceiver.new();
        await basketManager.initialize(basketCore.address);
        await basketCore.initialize(basketManager.address, feeReceiver.address, basketToken.address);
        token1 = await MockToken.new("TEST1", "TEST1");
        await basketManager.addToken(token1.address);
        token2 = await MockToken.new("TEST2", "TEST2");
        await basketManager.addToken(token2.address);

        accountFactory = await AccountFactory.new();
        mintRedeemApplication = await MintRedeemApplication.new(basketManager.address, accountFactory.address);
        // Grants admin role to MintRedeemApplication!
        await accountFactory.createAccount([mintRedeemApplication.address], {from: user});
        account = await accountFactory.getAccount(user);
        await accountFactory.createAccount([mintRedeemApplication.address], {from: user2});
        account2 = await accountFactory.getAccount(user2);
    });
    it("should be able to read parameters", async () => {
        assert.equal(await mintRedeemApplication.getBasketManager(), basketManager.address);
        assert.equal(await mintRedeemApplication.getAccountFactory(), accountFactory.address);
    });
    it("should be able mint basket token", async () => {
        await token1.mint(account, 1000);
        await token2.mint(account, 2000);
        const prevBalance = await basketToken.balanceOf(account);
        await mintRedeemApplication.mint([token1.address, token2.address], [1000, 1500], {from: user});
        const currBalance = await basketToken.balanceOf(account);
        assert.equal(currBalance - prevBalance, 2500);
    });
    it("should not be able to mint basket token if account is not created", async () => {
        await expectRevert(mintRedeemApplication.mint([token1.address, token2.address], [1000, 1500], {from: user3}),
            "MintRedeemApplication: Account not exist");
    });
    it("should be able to redeem basket token", async () => {
        await token1.mint(account, 1000);
        await token2.mint(account, 2000);
        await mintRedeemApplication.mint([token1.address, token2.address], [1000, 1500], {from: user});
        await (await Account.at(account)).withdrawToken(basketToken.address, account2, 2000, {from: user});
        const prevBalance1 = await token1.balanceOf(account2);
        const prevBalance2 = await token2.balanceOf(account2);
        await mintRedeemApplication.redeem(2000, {from: user2});
        const currBalance1 = await token1.balanceOf(account2);
        const currBalance2 = await token2.balanceOf(account2);
        assert.equal(currBalance1 - prevBalance1, 800);
        assert.equal(currBalance2 - prevBalance2, 1200);
    });
    it("should not be able to redeem basket token if account is not created", async () => {
        await expectRevert(mintRedeemApplication.redeem(2000, {from: user3}),
            "MintRedeemApplication: Account not exist");
    });
    it("should be able to read redemption amounts", async () => {
        await token1.mint(account, 1000);
        await token2.mint(account, 2000);
        await mintRedeemApplication.mint([token1.address, token2.address], [1000, 1500], {from: user});
        const result = await mintRedeemApplication.getRedemptionAmounts(2000, {from: user});
        assert.deepEqual(result.tokenAddresses, [token1.address, token2.address]);
        assert.equal(result.amounts[0], 800);
        assert.equal(result.amounts[1], 1200);
    });
});