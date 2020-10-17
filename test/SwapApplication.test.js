const { BN, expectRevert, time } = require('@openzeppelin/test-helpers');
const assert = require('assert');
const ACoconutSwap = artifacts.require("ACoconutSwap");
const WBTC = artifacts.require("MockWBTC");
const RenBTC = artifacts.require("MockRenBTC");
const ACoconutBTC = artifacts.require("ACoconutBTC");
const Account = artifacts.require("Account");
const AccountFactory = artifacts.require("AccountFactory");
const SwapApplication = artifacts.require("SwapApplication");

const { utils } = web3;
const { toWei } = utils;

const PRECISION = '10000000000';
const MINT_FEE = '10000000';
const SWAP_FEE = '20000000';
const REDEEM_FEE = '50000000';

contract('SwapApplication', async ([owner, feeRecipient, user1, user2]) => {
    let wbtc;
    let renbtc;
    let acbtc;
    let swap;
    let accountFactory;
    let swapApplication;
    beforeEach(async () => {
        swap = await ACoconutSwap.new();
        wbtc = await WBTC.new();
        renbtc = await RenBTC.new();
        acbtc = await ACoconutBTC.new();
        await swap.initialize([wbtc.address, renbtc.address], [PRECISION, PRECISION],
            [MINT_FEE, SWAP_FEE, REDEEM_FEE], acbtc.address, feeRecipient, 100);
        await acbtc.setMinter(swap.address, true);

        const account = await Account.new();
        accountFactory = await AccountFactory.new(account.address);

        // Add initial liquidity to the swap: 110 WBCT and 90 renBTC
        await swap.unpause();
        await wbtc.mint(owner, '11000000000');
        await renbtc.mint(owner, '9000000000');
        await wbtc.approve(swap.address, '11000000000');
        await renbtc.approve(swap.address, '9000000000');
        await swap.mint(['11000000000', '9000000000'], 0);

        // WBTC and renBTC has 8 decimals, so it's 100 WBTC and 100 renBTC
        const amounts = await swap.getMintAmount(['11000000000', '9000000000']);

        swapApplication = await SwapApplication.new();
        await swapApplication.initialize(swap.address);
    });
    it("should initialize parameters", async () => {
        assert.strictEqual(await swapApplication.governance(), owner);
        assert.strictEqual(await swapApplication.swap(), swap.address);
    });
    it("should set governance", async () => {
        assert.strictEqual(await swapApplication.governance(), owner);
        await expectRevert(swapApplication.setGovernance(user2, {from: user1}), "not governance");
        await swapApplication.setGovernance(user1);
        assert.strictEqual(await swapApplication.governance(), user1);
    });
    it("should set swap", async () => {
        assert.strictEqual(await swapApplication.swap(), swap.address);
        await expectRevert(swapApplication.setSwap(user2, {from: user1}), "not governance");
        await swapApplication.setSwap(user1);
        assert.strictEqual(await swapApplication.swap(), user1);
    });
    it("should have account to swap", async () => {
        await accountFactory.createAccount([swapApplication.address], {from: user2});
        const account1 = await accountFactory.accounts(user2);
        await expectRevert(swapApplication.mintToken(account1, ['100', '200'], 0, {from: user1}), "not owner");
        await accountFactory.createAccount([], {from: user1});
        const account2 = await accountFactory.accounts(user1);
        await expectRevert(swapApplication.mintToken(account2, ['100', '200'], 0, {from: user1}), "not operator");
    });
    it("should mint correct amount of acbtc", async () => {
        await accountFactory.createAccount([swapApplication.address], {from: user1});
        const account = await accountFactory.accounts(user1);

        // 2 WBTC and 5 renBTC
        const mintAmount = await swap.getMintAmount(['200000000', '500000000']);
        await wbtc.mint(account, '200000000');
        await renbtc.mint(account, '500000000');

        assert.strictEqual((await wbtc.balanceOf(account)).toString(), '200000000');
        assert.strictEqual((await renbtc.balanceOf(account)).toString(), '500000000');
        assert.strictEqual((await acbtc.balanceOf(account)).toString(), '0');

        await swapApplication.mintToken(account, ['200000000', '500000000'], 0 , {from: user1});
        assert.strictEqual((await wbtc.balanceOf(account)).toString(), '0');
        assert.strictEqual((await renbtc.balanceOf(account)).toString(), '0');
        assert.strictEqual((await acbtc.balanceOf(account)).toString(), mintAmount[0].toString());
    });
    it("should swap correct amount of token", async () => {
        await accountFactory.createAccount([swapApplication.address], {from: user1});
        const account = await accountFactory.accounts(user1);

        // Swap 6 WBTC to renBTC
        const swapAmount = await swap.getSwapAmount(0, 1, '600000000');
        await wbtc.mint(account, '600000000');

        assert.strictEqual((await wbtc.balanceOf(account)).toString(), '600000000');
        assert.strictEqual((await renbtc.balanceOf(account)).toString(), '0');
        assert.strictEqual((await acbtc.balanceOf(account)).toString(), '0');

        await swapApplication.swapToken(account, 0, 1, '600000000', 0, {from: user1});
        assert.strictEqual((await wbtc.balanceOf(account)).toString(), '0');
        assert.strictEqual((await renbtc.balanceOf(account)).toString(), swapAmount.toString());
        assert.strictEqual((await acbtc.balanceOf(account)).toString(), '0');
    });
    it("should redeem correct amount of tokens proportionally", async () => {
        await accountFactory.createAccount([swapApplication.address], {from: user1});
        const account = await accountFactory.accounts(user1);

        // Redeem 8 acBTC
        const redeemAmounts = await swap.getRedeemProportionAmount(toWei('8'));
        await acbtc.transfer(account, toWei('8'));

        assert.strictEqual((await wbtc.balanceOf(account)).toString(), '0');
        assert.strictEqual((await renbtc.balanceOf(account)).toString(), '0');
        assert.strictEqual((await acbtc.balanceOf(account)).toString(), toWei('8'));

        await swapApplication.redeemProportion(account, toWei('8'), [0, 0], {from: user1});
        assert.strictEqual((await wbtc.balanceOf(account)).toString(), redeemAmounts[0][0].toString());
        assert.strictEqual((await renbtc.balanceOf(account)).toString(), redeemAmounts[0][1].toString());
        assert.strictEqual((await acbtc.balanceOf(account)).toString(), '0');
    });
    it("should redeem correct amount of single token", async () => {
        await accountFactory.createAccount([swapApplication.address], {from: user1});
        const account = await accountFactory.accounts(user1);

        // Redeem 8 acBTC
        const redeemAmounts = await swap.getRedeemSingleAmount(toWei('8'), 1);
        await acbtc.transfer(account, toWei('8'));

        assert.strictEqual((await wbtc.balanceOf(account)).toString(), '0');
        assert.strictEqual((await renbtc.balanceOf(account)).toString(), '0');
        assert.strictEqual((await acbtc.balanceOf(account)).toString(), toWei('8'));

        await swapApplication.redeemSingle(account, toWei('8'), 1, 0, {from: user1});
        assert.strictEqual((await wbtc.balanceOf(account)).toString(), '0');
        assert.strictEqual((await renbtc.balanceOf(account)).toString(), redeemAmounts[0].toString());
        assert.strictEqual((await acbtc.balanceOf(account)).toString(), '0');
    });
    it("should redeem correct amount of multiple tokens", async () => {
        await accountFactory.createAccount([swapApplication.address], {from: user1});
        const account = await accountFactory.accounts(user1);

        // Redeem 2 WBTC and 3 renBTC
        const redeemAmounts = await swap.getRedeemMultiAmount(['200000000', '300000000']);
        await acbtc.transfer(account, toWei('8'));

        assert.strictEqual((await wbtc.balanceOf(account)).toString(), '0');
        assert.strictEqual((await renbtc.balanceOf(account)).toString(), '0');
        assert.strictEqual((await acbtc.balanceOf(account)).toString(), toWei('8'));

        await swapApplication.redeemMulti(account, ['200000000', '300000000'], toWei('8'), {from: user1});
        assert.strictEqual((await wbtc.balanceOf(account)).toString(), '200000000');
        assert.strictEqual((await renbtc.balanceOf(account)).toString(), '300000000');
        assert.strictEqual((await acbtc.balanceOf(account)).toString(), new BN(toWei('8')).sub(redeemAmounts[0]).toString());
    });
});