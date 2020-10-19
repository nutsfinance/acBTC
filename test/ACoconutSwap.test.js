const { expectRevert, BN } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const assert = require('assert');
const ACoconutSwap = artifacts.require("ACoconutSwap");
const WBTC = artifacts.require("MockWBTC");
const RenBTC = artifacts.require("MockRenBTC");
const ACoconutBTC = artifacts.require("ACoconutBTC");

const { utils } = web3;
const { toWei } = utils;

const PRECISION = '10000000000';
const MINT_FEE = '10000000';
const SWAP_FEE = '20000000';
const REDEEM_FEE = '50000000';
const FEE_DENOMITOR = '10000000000';

const assertFee = (getAmount, feeAmount, fee) => {
    const expectedFee = new BN(getAmount).mul(new BN(fee)).div(new BN(FEE_DENOMITOR));
    assert.strictEqual(feeAmount.toString(), expectedFee.toString());
};

const assertAlmostTheSame = (num1, num2) => {
    // Assert that the difference is smaller than 0.01%
    const diff = num1.sub(num2).abs().mul(new BN(10000)).div(BN.min(num1, num2)).toNumber();
    assert.strictEqual(diff, 0);
};

const assetInvariant = async (balance0, balance1, A, D) => {
    // We only check n = 2 here
    const left = new BN(A * 4).mul(new BN(balance0).add(new BN(balance1))).add(new BN(D));
    // const num = new BN(D).pow(new BN('3')).div(new BN(balance0).mul(new BN(balance1)).mul(new BN('4')));
    const right = new BN(A * 4).mul(new BN(D)).add(new BN(D).pow(new BN('3')).div(new BN(balance0).mul(new BN(balance1)).mul(new BN('4'))));

    assertAlmostTheSame(left, right);
};


contract('ACoconutSwap', async ([owner, admin, feeRecipient, user, user2]) => {
    let swap;
    let wbtc;
    let renbtc;
    let acbtc;
    beforeEach(async () => {
        swap = await ACoconutSwap.new();
        wbtc = await WBTC.new();
        renbtc = await RenBTC.new();
        acbtc = await ACoconutBTC.new();
        await swap.initialize([wbtc.address, renbtc.address], [PRECISION, PRECISION],
            [MINT_FEE, SWAP_FEE, REDEEM_FEE], acbtc.address, 100);
        await acbtc.setMinter(swap.address, true);
        await swap.setFeeRecipient(feeRecipient);
    });
    it("should initialize paramters", async () => {
        assert.strictEqual(await swap.tokens(0), wbtc.address);
        assert.strictEqual(await swap.tokens(1), renbtc.address);
        assert.strictEqual((await swap.precisions(0)).toString(), PRECISION);
        assert.strictEqual((await swap.precisions(1)).toString(), PRECISION);
        assert.strictEqual((await swap.mintFee()).toString(), MINT_FEE);
        assert.strictEqual((await swap.swapFee()).toString(), SWAP_FEE);
        assert.strictEqual((await swap.redeemFee()).toString(), REDEEM_FEE);
        assert.strictEqual(await swap.poolToken(), acbtc.address);
        assert.strictEqual(await swap.feeRecipient(), feeRecipient);
        assert.strictEqual(await swap.governance(), owner);
        assert.strictEqual(await swap.paused(), true);
        assert.strictEqual((await swap.initialA()).toNumber(), 100);
    });
    it('should return the correct mint amount when two tokens are equal', async () => {
        // WBTC and renBTC has 8 decimals, so it's 100 WBTC and 100 renBTC
        const amounts = await swap.getMintAmount(['10000000000', '10000000000']);
        const mintAmount = amounts[0];
        const feeAmount = amounts[1];
        const totalAmount = mintAmount.add(feeAmount);
        assert.strictEqual(totalAmount.toString(), toWei('200'));
        assertFee(totalAmount, feeAmount, MINT_FEE);

        // Convert 100 WBTC and 100 renBTC to 18 decimals
        assetInvariant(toWei('100'), toWei('100'), 100, toWei('200'));
    });
    it('should return the correct mint amount when two tokens are not equal', async () => {
        // WBTC and renBTC has 8 decimals, so it's 110 WBTC and 90 renBTC
        const amounts = await swap.getMintAmount(['11000000000', '9000000000']);
        const mintAmount = amounts[0];
        const feeAmount = amounts[1];
        const totalAmount = mintAmount.add(feeAmount);
        assertFee(totalAmount, feeAmount, MINT_FEE);

        // Convert 110 WBTC and 90 renBTC to 18 decimals
        assetInvariant(toWei('110'), toWei('90'), 100, totalAmount);
    });
    it("should mint the correct amount when two tokens are equal", async () => {
        await swap.unpause();
        await wbtc.mint(user, '10000000000');
        await renbtc.mint(user, '10000000000');
        await wbtc.approve(swap.address, '10000000000', {from: user});
        await renbtc.approve(swap.address, '10000000000', {from: user});

        // WBTC and renBTC has 8 decimals, so it's 100 WBTC and 100 renBTC
        const amounts = await swap.getMintAmount(['10000000000', '10000000000']);
        const mintAmount = amounts[0];
        const feeAmount = amounts[1];

        assert.strictEqual((await wbtc.balanceOf(user)).toString(), '10000000000');
        assert.strictEqual((await renbtc.balanceOf(user)).toString(), '10000000000');
        assert.strictEqual((await acbtc.balanceOf(user)).toString(), '0');
        assert.strictEqual((await acbtc.balanceOf(feeRecipient)).toString(), '0');
        assert.strictEqual((await swap.balances(0)).toString(), '0');
        assert.strictEqual((await swap.balances(1)).toString(), '0');
        assert.strictEqual((await swap.totalSupply()).toString(), (await acbtc.totalSupply()).toString());

        await swap.mint(['10000000000', '10000000000'], 0, {from: user});
        assert.strictEqual((await wbtc.balanceOf(user)).toString(), '0');
        assert.strictEqual((await renbtc.balanceOf(user)).toString(), '0');
        assert.strictEqual((await acbtc.balanceOf(user)).toString(), mintAmount.toString());
        assert.strictEqual((await acbtc.balanceOf(feeRecipient)).toString(), feeAmount.toString());
        assert.strictEqual((await swap.balances(0)).toString(), toWei('100'));
        assert.strictEqual((await swap.balances(1)).toString(), toWei('100'));
        assert.strictEqual((await swap.totalSupply()).toString(), (await acbtc.totalSupply()).toString());
    });
    it("should mint the correct amount when two tokens are not equal", async () => {
        await swap.unpause();
        await wbtc.mint(user, '11000000000');
        await renbtc.mint(user, '9000000000');
        await wbtc.approve(swap.address, '11000000000', {from: user});
        await renbtc.approve(swap.address, '9000000000', {from: user});

        // WBTC and renBTC has 8 decimals, so it's 100 WBTC and 100 renBTC
        const amounts = await swap.getMintAmount(['11000000000', '9000000000']);
        const mintAmount = amounts[0];
        const feeAmount = amounts[1];

        assert.strictEqual((await wbtc.balanceOf(user)).toString(), '11000000000');
        assert.strictEqual((await renbtc.balanceOf(user)).toString(), '9000000000');
        assert.strictEqual((await acbtc.balanceOf(user)).toString(), '0');
        assert.strictEqual((await acbtc.balanceOf(feeRecipient)).toString(), '0');
        assert.strictEqual((await swap.totalSupply()).toString(), (await acbtc.totalSupply()).toString());

        await swap.mint(['11000000000', '9000000000'], 0, {from: user});
        assert.strictEqual((await wbtc.balanceOf(user)).toString(), '0');
        assert.strictEqual((await renbtc.balanceOf(user)).toString(), '0');
        assert.strictEqual((await acbtc.balanceOf(user)).toString(), mintAmount.toString());
        assert.strictEqual((await acbtc.balanceOf(feeRecipient)).toString(), feeAmount.toString());
        assert.strictEqual((await swap.balances(0)).toString(), toWei('110'));
        assert.strictEqual((await swap.balances(1)).toString(), toWei('90'));
        assert.strictEqual((await swap.totalSupply()).toString(), (await acbtc.totalSupply()).toString());
    });
    it('should return the correct mint amount with initial balance when two tokens are equal', async () => {
        await swap.unpause();
        await wbtc.mint(user, '10500000000');
        await renbtc.mint(user, '8500000000');
        await wbtc.approve(swap.address, '10500000000', {from: user});
        await renbtc.approve(swap.address, '8500000000', {from: user});
        await swap.mint(['10500000000', '8500000000'], 0, {from: user});

        // WBTC and renBTC has 8 decimals, so it's 100 WBTC and 100 renBTC
        const amounts = await swap.getMintAmount(['10000000000', '10000000000']);
        const mintAmount = amounts[0];
        const feeAmount = amounts[1];
        const totalAmount = mintAmount.add(feeAmount);
        assertFee(totalAmount, feeAmount, MINT_FEE);

        // Convert 100 WBTC and 100 renBTC to 18 decimals
        assetInvariant(toWei('100'), toWei('100'), 100, toWei('200'));
    });
    it('should return the correct mint amount with initial balance when two tokens are not equal', async () => {
        await swap.unpause();
        await wbtc.mint(user, '10500000000');
        await renbtc.mint(user, '8500000000');
        await wbtc.approve(swap.address, '10500000000', {from: user});
        await renbtc.approve(swap.address, '8500000000', {from: user});
        await swap.mint(['10500000000', '8500000000'], 0, {from: user});

        // WBTC and renBTC has 8 decimals, so it's 110 WBTC and 90 renBTC
        const amounts = await swap.getMintAmount(['11000000000', '9000000000']);
        const mintAmount = amounts[0];
        const feeAmount = amounts[1];
        const totalAmount = mintAmount.add(feeAmount);
        assertFee(totalAmount, feeAmount, MINT_FEE);

        // Convert 110 WBTC and 90 renBTC to 18 decimals
        assetInvariant(toWei('110'), toWei('90'), 100, totalAmount);
    });
    it("should return the correct exchange amount", async () => {
        await swap.unpause();
        // We use total amount to approximate D!
        const amounts = await swap.getMintAmount(['10500000000', '8500000000']);
        const totalAmount = amounts[0].add(amounts[1]);
        await wbtc.mint(user, '10500000000');
        await renbtc.mint(user, '8500000000');
        await wbtc.approve(swap.address, '10500000000', {from: user});
        await renbtc.approve(swap.address, '8500000000', {from: user});
        await swap.mint(['10500000000', '8500000000'], 0, {from: user});
        
        await renbtc.mint(user2, '800000000');
        await renbtc.approve(swap.address, '800000000');
        const exchangeAmount = await swap.getSwapAmount(1, 0, '800000000');
        const exchangeTotal = exchangeAmount.mul(new BN(FEE_DENOMITOR)).div(new BN(FEE_DENOMITOR).sub(new BN(SWAP_FEE)));

        // Before exchange, we have 105 WBTC and 85 renBTC
        // After exchange, 8 renBTC is exchanged in so that renBTC balance becomes 93
        assetInvariant(new BN(toWei('105')).sub(exchangeTotal.mul(new BN(PRECISION))), toWei('93'), 100, totalAmount);
    });
    it("should exchange the correct amount", async () => {
        await swap.unpause();
        await wbtc.mint(user, '10500000000');
        await renbtc.mint(user, '8500000000');
        await wbtc.approve(swap.address, '10500000000', {from: user});
        await renbtc.approve(swap.address, '8500000000', {from: user});
        await swap.mint(['10500000000', '8500000000'], 0, {from: user});
        
        await renbtc.mint(user2, '800000000');
        await renbtc.approve(swap.address, '800000000', {from: user2});
        // 8 renBTC
        const exchangeAmount = await swap.getSwapAmount(1, 0, '800000000');
        const exchangeTotal = exchangeAmount.mul(new BN(FEE_DENOMITOR)).div(new BN(FEE_DENOMITOR).sub(new BN(SWAP_FEE)));

        assert.strictEqual((await wbtc.balanceOf(user2)).toString(), '0');
        assert.strictEqual((await renbtc.balanceOf(user2)).toString(), '800000000');
        assert.strictEqual((await wbtc.balanceOf(swap.address)).toString(), '10500000000');
        assert.strictEqual((await renbtc.balanceOf(swap.address)).toString(), '8500000000');
        assert.strictEqual((await swap.balances(0)).toString(), toWei('105'));
        assert.strictEqual((await swap.balances(1)).toString(), toWei('85'));
        assert.strictEqual((await swap.totalSupply()).toString(), (await acbtc.totalSupply()).toString());

        // Swap 8 renBTC to wBTC
        await swap.swap(1, 0, '800000000', 0, {from: user2});

        // The amount of WBTC got. In original format.
        assert.strictEqual((await wbtc.balanceOf(user2)).toString(), exchangeAmount.toString());
        assert.strictEqual((await renbtc.balanceOf(user2)).toString(), '0');
        // 105 WBTC - actual exchange output  (in original format)
        assert.strictEqual((await wbtc.balanceOf(swap.address)).toString(), new BN('10500000000').sub(new BN(exchangeAmount)).toString());
        // 85 renBTC + 8 renBTC  (in original format)
        assert.strictEqual((await renbtc.balanceOf(swap.address)).toString(), '9300000000');
        // 105 WBTC - (actual exchange output + exchange fee)   (in converted format)
        assertAlmostTheSame(await swap.balances(0), new BN(toWei('105')).sub(new BN(exchangeTotal).mul(new BN(PRECISION))));
        // 85 renBTC + 8 renBTC (in converted format)
        assert.strictEqual((await swap.balances(1)).toString(), toWei('93'));
        assert.strictEqual((await swap.totalSupply()).toString(), (await acbtc.totalSupply()).toString());
    });
    it("should return the correct redeem amount with proportional redemption", async () => {
        await swap.unpause();
        // We use total amount to approximate D!
        const mintAmounts = await swap.getMintAmount(['10500000000', '8500000000']);
        const totalAmount = mintAmounts[0].add(mintAmounts[1]);
        await wbtc.mint(user, '10500000000');
        await renbtc.mint(user, '8500000000');
        await wbtc.approve(swap.address, '10500000000', {from: user});
        await renbtc.approve(swap.address, '8500000000', {from: user});
        await swap.mint(['10500000000', '8500000000'], 0, {from: user});

        const amounts = await swap.getRedeemProportionAmount(toWei('25'));
        const wbtcAmount = amounts[0][0];
        const renbtcAmount = amounts[0][1];
        const feeAmount = amounts[1];
        
        // Assert that acbtc redeemed / acbtc total = wbtc amount / wbtc balance = renbtc amount / renbtc balance
        assertAlmostTheSame(new BN(toWei('25')).sub(feeAmount).mul(new BN(toWei('105'))), new BN(wbtcAmount).mul(new BN(PRECISION)).mul(totalAmount));
        assertAlmostTheSame(new BN(toWei('25')).sub(feeAmount).mul(new BN(toWei('85'))), new BN(renbtcAmount).mul(new BN(PRECISION)).mul(totalAmount));

        assetInvariant(new BN(toWei('105')).sub(wbtcAmount.mul(new BN(PRECISION))),
            new BN(toWei('85')).sub(renbtcAmount.mul(new BN(PRECISION))), 100, totalAmount.sub(new BN(toWei('25')).sub(feeAmount)));
    });
    it("should redeem the correct amount with proportional redemption", async () => {
        await swap.unpause();
        // We use total amount to approximate D!
        const mintAmounts = await swap.getMintAmount(['10500000000', '8500000000']);
        const totalAmount = mintAmounts[0].add(mintAmounts[1]);
        await wbtc.mint(user, '10500000000');
        await renbtc.mint(user, '8500000000');
        await wbtc.approve(swap.address, '10500000000', {from: user});
        await renbtc.approve(swap.address, '8500000000', {from: user});
        await swap.mint(['10500000000', '8500000000'], 0, {from: user});

        const amounts = await swap.getRedeemProportionAmount(toWei('25'));
        const wbtcAmount = amounts[0][0];
        const renbtcAmount = amounts[0][1];
        const feeAmount = amounts[1];

        await acbtc.transfer(user2, toWei('25'), {from: user});

        assert.strictEqual((await wbtc.balanceOf(user2)).toString(), '0');
        assert.strictEqual((await renbtc.balanceOf(user2)).toString(), '0');
        assert.strictEqual((await acbtc.balanceOf(user2)).toString(), toWei('25'));
        assert.strictEqual((await wbtc.balanceOf(swap.address)).toString(), '10500000000');
        assert.strictEqual((await renbtc.balanceOf(swap.address)).toString(), '8500000000');
        assert.strictEqual((await swap.balances(0)).toString(), toWei('105'));
        assert.strictEqual((await swap.balances(1)).toString(), toWei('85'));
        assert.strictEqual((await swap.totalSupply()).toString(), (await acbtc.totalSupply()).toString());

        const feeBefore = await acbtc.balanceOf(feeRecipient);
        // Swap 8 renBTC to wBTC
        await acbtc.approve(swap.address, toWei('25'), {from: user2});
        const tx = await swap.redeemProportion(toWei('25'), [0, 0], {from: user2});
        console.log('Redeem proportion: ' + tx.receipt.gasUsed);

        // The amount of WBTC got. In original format.
        assert.strictEqual((await wbtc.balanceOf(user2)).toString(), wbtcAmount.toString());
        assert.strictEqual((await renbtc.balanceOf(user2)).toString(), renbtcAmount.toString());
        assert.strictEqual((await acbtc.balanceOf(user2)).toString(), '0');
        assert.strictEqual((await acbtc.balanceOf(feeRecipient)).toString(), feeAmount.add(feeBefore).toString());
        assert.strictEqual((await wbtc.balanceOf(swap.address)).toString(), new BN('10500000000').sub(wbtcAmount).toString());
        assert.strictEqual((await renbtc.balanceOf(swap.address)).toString(), new BN('8500000000').sub(renbtcAmount).toString());
        assertAlmostTheSame(await swap.balances(0), new BN(toWei('105')).sub(wbtcAmount.mul(new BN(PRECISION))));
        assertAlmostTheSame(await swap.balances(1), new BN(toWei('85')).sub(renbtcAmount.mul(new BN(PRECISION))));
        assert.strictEqual((await swap.totalSupply()).toString(), (await acbtc.totalSupply()).toString());
    });
    it("should return the correct redeem amount to a single token", async () => {
        await swap.unpause();
        // We use total amount to approximate D!
        const mintAmounts = await swap.getMintAmount(['10500000000', '8500000000']);
        const totalAmount = mintAmounts[0].add(mintAmounts[1]);
        await wbtc.mint(user, '10500000000');
        await renbtc.mint(user, '8500000000');
        await wbtc.approve(swap.address, '10500000000', {from: user});
        await renbtc.approve(swap.address, '8500000000', {from: user});
        await swap.mint(['10500000000', '8500000000'], 0, {from: user});

        const redeemAmount = new BN(toWei('25'));
        const amounts = await swap.getRedeemSingleAmount(redeemAmount, 0);
        const wbtcAmount = amounts[0];
        const feeAmount = amounts[1];
        
        assetInvariant(new BN(toWei('105')).sub(wbtcAmount.mul(new BN(PRECISION))), new BN(toWei('85')), 100, totalAmount.sub(redeemAmount.sub(feeAmount)));
    });
    it("should redeem the correct amount to a single token", async () => {
        await swap.unpause();
        // We use total amount to approximate D!
        const mintAmounts = await swap.getMintAmount(['10500000000', '8500000000']);
        const totalAmount = mintAmounts[0].add(mintAmounts[1]);
        await wbtc.mint(user, '10500000000');
        await renbtc.mint(user, '8500000000');
        await wbtc.approve(swap.address, '10500000000', {from: user});
        await renbtc.approve(swap.address, '8500000000', {from: user});
        await swap.mint(['10500000000', '8500000000'], 0, {from: user});

        const redeemAmount = new BN(toWei('25'));
        const amounts = await swap.getRedeemSingleAmount(redeemAmount, 0);
        const wbtcAmount = amounts[0];
        const feeAmount = amounts[1];

        await acbtc.transfer(user2, redeemAmount, {from: user});

        assert.strictEqual((await wbtc.balanceOf(user2)).toString(), '0');
        assert.strictEqual((await renbtc.balanceOf(user2)).toString(), '0');
        assert.strictEqual((await acbtc.balanceOf(user2)).toString(), redeemAmount.toString());
        assert.strictEqual((await wbtc.balanceOf(swap.address)).toString(), '10500000000');
        assert.strictEqual((await renbtc.balanceOf(swap.address)).toString(), '8500000000');
        assert.strictEqual((await swap.balances(0)).toString(), toWei('105'));
        assert.strictEqual((await swap.balances(1)).toString(), toWei('85'));
        assert.strictEqual((await swap.totalSupply()).toString(), (await acbtc.totalSupply()).toString());

        const feeBefore = await acbtc.balanceOf(feeRecipient);
        await acbtc.approve(swap.address, redeemAmount, {from: user2});
        const tx = await swap.redeemSingle(redeemAmount, 0, 0, {from: user2});
        console.log('Redeem single: ' + tx.receipt.gasUsed);

        // The amount of WBTC got. In original format.
        assert.strictEqual((await wbtc.balanceOf(user2)).toString(), wbtcAmount.toString());
        assert.strictEqual((await renbtc.balanceOf(user2)).toString(), '0');
        assert.strictEqual((await acbtc.balanceOf(user2)).toString(), '0');
        assert.strictEqual((await acbtc.balanceOf(feeRecipient)).toString(), feeAmount.add(feeBefore).toString());
        assert.strictEqual((await wbtc.balanceOf(swap.address)).toString(), new BN('10500000000').sub(wbtcAmount).toString());
        assert.strictEqual((await renbtc.balanceOf(swap.address)).toString(), new BN('8500000000').toString());
        assertAlmostTheSame(await swap.balances(0), new BN(toWei('105')).sub(wbtcAmount.mul(new BN(PRECISION))));
        assert.strictEqual((await swap.balances(1)).toString(), toWei('85'));
        assert.strictEqual((await swap.totalSupply()).toString(), (await acbtc.totalSupply()).toString());
    });
    it("should return the correct redeem amount to multiple tokens", async () => {
        await swap.unpause();
        // We use total amount to approximate D!
        const mintAmounts = await swap.getMintAmount(['10500000000', '8500000000']);
        const totalAmount = mintAmounts[0].add(mintAmounts[1]);
        await wbtc.mint(user, '10500000000');
        await renbtc.mint(user, '8500000000');
        await wbtc.approve(swap.address, '10500000000', {from: user});
        await renbtc.approve(swap.address, '8500000000', {from: user});
        await swap.mint(['10500000000', '8500000000'], 0, {from: user});

        const amounts = await swap.getRedeemMultiAmount(['1000000000', '500000000']);
        const redeemAmount = amounts[0];
        const feeAmount = amounts[1];
        
        assertFee(redeemAmount, feeAmount, REDEEM_FEE);
        assetInvariant(new BN(toWei('95')), new BN(toWei('80')), 100, totalAmount.sub(redeemAmount.sub(feeAmount)));
    });
    it("should redeem the correct amount to multiple tokens", async () => {
        await swap.unpause();
        // We use total amount to approximate D!
        const mintAmounts = await swap.getMintAmount(['10500000000', '8500000000']);
        const totalAmount = mintAmounts[0].add(mintAmounts[1]);
        await wbtc.mint(user, '10500000000');
        await renbtc.mint(user, '8500000000');
        await wbtc.approve(swap.address, '10500000000', {from: user});
        await renbtc.approve(swap.address, '8500000000', {from: user});
        await swap.mint(['10500000000', '8500000000'], 0, {from: user});

        const amounts = await swap.getRedeemMultiAmount(['1000000000', '500000000']);
        const redeemAmount = amounts[0];
        const feeAmount = amounts[1];

        await acbtc.transfer(user2, toWei('25'), {from: user});

        assert.strictEqual((await wbtc.balanceOf(user2)).toString(), '0');
        assert.strictEqual((await renbtc.balanceOf(user2)).toString(), '0');
        assert.strictEqual((await acbtc.balanceOf(user2)).toString(), toWei('25'));
        assert.strictEqual((await wbtc.balanceOf(swap.address)).toString(), '10500000000');
        assert.strictEqual((await renbtc.balanceOf(swap.address)).toString(), '8500000000');
        assert.strictEqual((await swap.balances(0)).toString(), toWei('105'));
        assert.strictEqual((await swap.balances(1)).toString(), toWei('85'));
        assert.strictEqual((await swap.totalSupply()).toString(), (await acbtc.totalSupply()).toString());

        const feeBefore = await acbtc.balanceOf(feeRecipient);
        await acbtc.approve(swap.address, redeemAmount, {from: user2});
        const tx = await swap.redeemMulti(['1000000000', '500000000'], redeemAmount, {from: user2});
        console.log('Redeem multi: ' + tx.receipt.gasUsed);

        // The amount of WBTC got. In original format.
        assert.strictEqual((await wbtc.balanceOf(user2)).toString(), '1000000000');
        assert.strictEqual((await renbtc.balanceOf(user2)).toString(), '500000000');
        assert.strictEqual((await acbtc.balanceOf(user2)).toString(), new BN(toWei('25')).sub(redeemAmount).toString());
        assert.strictEqual((await acbtc.balanceOf(feeRecipient)).toString(), feeAmount.add(feeBefore).toString());
        assert.strictEqual((await wbtc.balanceOf(swap.address)).toString(), '9500000000');
        assert.strictEqual((await renbtc.balanceOf(swap.address)).toString(), '8000000000');
        assert.strictEqual((await swap.balances(0)).toString(), toWei('95'));
        assert.strictEqual((await swap.balances(1)).toString(), toWei('80'));
        assert.strictEqual((await swap.totalSupply()).toString(), (await acbtc.totalSupply()).toString());
    });
    it("should collect the correct amount of fee", async () => {
        await swap.unpause();
        await wbtc.mint(user, '10500000000');
        await renbtc.mint(user, '8500000000');
        await wbtc.approve(swap.address, '10500000000', {from: user});
        await renbtc.approve(swap.address, '8500000000', {from: user});
        await swap.mint(['10500000000', '8500000000'], 0, {from: user});
        
        const tx = await renbtc.mint(user2, '800000000');
        console.log('Mint: ' + tx.receipt.gasUsed);
        await renbtc.approve(swap.address, '800000000', {from: user2});
        
        const feeBefore = await acbtc.balanceOf(feeRecipient);

        // Swap 8 renBTC to wBTC
        const tx2 = await swap.swap(1, 0, '800000000', 0, {from: user2});
        console.log('Swap: ' + tx2.receipt.gasUsed);

        assert.strictEqual((await swap.totalSupply()).toString(), (await acbtc.totalSupply()).toString());
        const fee = await swap.getPendingFeeAmount();
        assert.notStrictEqual(fee.toString(), '0');
        await expectRevert(swap.collectFee(), "not admin");

        await swap.setAdmin(owner, true);
        await swap.collectFee();
        assert.strictEqual((await swap.getPendingFeeAmount()).toString(), '0');
        assert.strictEqual((await feeBefore.add(fee)).toString(), (await acbtc.balanceOf(feeRecipient)).toString());
        assert.strictEqual((await swap.totalSupply()).toString(), (await acbtc.totalSupply()).toString());
    });
    it("should allow to update governance", async () => {
        await expectRevert(swap.setGovernance(user, {from: admin}), "not governance");
        swap.setGovernance(user);
        assert.strictEqual(await swap.governance(), user);
    });
    it("should allow to update mint fee", async () => {
        await expectRevert(swap.setMintFee('1000', {from: admin}), "not governance");
        swap.setMintFee('1000');
        assert.strictEqual((await swap.mintFee()).toString(), '1000');
    });
    it("should allow to update swap fee", async () => {
        await expectRevert(swap.setSwapFee('1000', {from: admin}), "not governance");
        swap.setSwapFee('1000');
        assert.strictEqual((await swap.swapFee()).toString(), '1000');
    });
    it("should allow to update redeem fee", async () => {
        await expectRevert(swap.setRedeemFee('1000', {from: admin}), "not governance");
        swap.setRedeemFee('1000');
        assert.strictEqual((await swap.redeemFee()).toString(), '1000');
    });
    it("should allow to pause and unpause", async () => {
        await expectRevert(swap.pause({from: admin}), "not governance");
        await expectRevert(swap.pause(), "paused");
        await swap.unpause();
        assert.strictEqual(await swap.paused(), false);
        await expectRevert(swap.unpause({from: admin}), "not governance");
        await expectRevert(swap.unpause(), "not paused");
        await swap.pause();
        assert.strictEqual(await swap.paused(), true);
    });
});