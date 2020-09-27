const { BN, expectRevert, time } = require('@openzeppelin/test-helpers');
const assert = require('assert');
const MockToken = artifacts.require("MockWBTC");
const MockRewardToken = artifacts.require("MockRenBTC");
const Controller = artifacts.require("MockController");
const RewardedVault = artifacts.require("RewardedVault");
const Strategy = artifacts.require("MockStrategy");

async function timeIncreaseTo (seconds) {
    const delay = 10 - new Date().getMilliseconds();
    await new Promise(resolve => setTimeout(resolve, delay));
    await time.increaseTo(seconds);
}

const assertAlmostEqual = function(expectedOrig, actualOrig) {
    const _1e18 = new BN('10').pow(new BN('18'));
    const expected = new BN(expectedOrig).div(_1e18).toNumber();
    const actual = new BN(actualOrig).div(_1e18).toNumber();

    assert.ok(Math.abs(expected - actual) <= 2, `Expected ${expected}, actual ${actual}`);
}

contract("RewardedVault", async ([owner, user1, user2, user3, user4]) => {
    let token;
    let rewardToken;
    let controller;
    let vault;
    let strategy;
    let startTime;

    beforeEach(async () => {
        token = await MockToken.new();
        rewardToken = await MockRewardToken.new();
        controller = await Controller.new(rewardToken.address);
        vault = await RewardedVault.new("Mock Token Vault Token", "Mockv", controller.address, token.address);
        strategy = await Strategy.new(token.address, vault.address);
        await vault.setStrategy(strategy.address);

        await rewardToken.mint(vault.address, web3.utils.toWei('1000000'));
        await token.mint(user1, web3.utils.toWei('1000'));
        await token.mint(user2, web3.utils.toWei('1000'));
        await token.mint(user3, web3.utils.toWei('1000'));
        await token.mint(user4, web3.utils.toWei('1000'));

        await token.approve(vault.address, new BN(2).pow(new BN(255)), { from: user1 });
        await token.approve(vault.address, new BN(2).pow(new BN(255)), { from: user2 });
        await token.approve(vault.address, new BN(2).pow(new BN(255)), { from: user3 });
        await token.approve(vault.address, new BN(2).pow(new BN(255)), { from: user4 });

        startTime = (await time.latest()).addn(10);
        await timeIncreaseTo(startTime);
    });
    it("should initialize paramters", async () => {
        assert.strictEqual(await vault.controller(), controller.address);
    });
    it("should be able to update controller", async () => {
        const newController = await Controller.new(rewardToken.address);
        await vault.setController(newController.address);
        assert.strictEqual(await vault.controller(), newController.address);
    });
    it("should only allow govenance to update controller", async () => {
        const newController = await Controller.new(rewardToken.address);
        await expectRevert(vault.setController(newController.address, {from: user1}), "not governance");
    });
    it("should only allow controller to notify rewards", async () => {
        await expectRevert(vault.notifyRewardAmount(web3.utils.toWei('72000')), "not controller");
    });

    it('Two stakers with the same stakes wait 1 w', async function () {
        // 72000 reward tokens per week for 3 weeks
        await controller.notifyReward(vault.address, web3.utils.toWei('72000'));

        assertAlmostEqual(await vault.rewardPerToken(), '0');
        assert.strictEqual((await vault.earned(user1)).toString(), '0');
        assert.strictEqual((await vault.earned(user2)).toString(), '0');

        await vault.deposit(web3.utils.toWei('1'), { from: user1 });
        await vault.deposit(web3.utils.toWei('1'), { from: user2 });

        assertAlmostEqual(await vault.rewardPerToken(), '0');
        assert.strictEqual((await vault.earned(user1)).toString(), '0');
        assert.strictEqual((await vault.earned(user2)).toString(), '0');

        await timeIncreaseTo(startTime.add(time.duration.weeks(1)));

        assertAlmostEqual(await vault.rewardPerToken(), web3.utils.toWei('36000'));
        assertAlmostEqual((await vault.earned(user1)).toString(), web3.utils.toWei('36000'));
        assertAlmostEqual((await vault.earned(user2)).toString(), web3.utils.toWei('36000'));
    });

    it('Two stakers with the different (1:3) stakes wait 1 w', async function () {
        // 72000 reward tokens per week
        await controller.notifyReward(vault.address, web3.utils.toWei('72000'));

        assertAlmostEqual(await vault.rewardPerToken(), '0');
        assert.strictEqual((await vault.earned(user1)).toString(), '0');
        assert.strictEqual((await vault.earned(user2)).toString(), '0');
        assert.strictEqual((await vault.balanceOf(user1)).toString(), '0');
        assert.strictEqual((await vault.balanceOf(user2)).toString(), '0');

        await vault.deposit(web3.utils.toWei('1'), { from: user1 });
        await vault.deposit(web3.utils.toWei('3'), { from: user2 });

        assertAlmostEqual(await vault.rewardPerToken(), '0');
        assert.strictEqual((await vault.earned(user1)).toString(), '0');
        assert.strictEqual((await vault.earned(user2)).toString(), '0');

        await timeIncreaseTo(startTime.add(time.duration.weeks(1)));

        assertAlmostEqual(await vault.rewardPerToken(), web3.utils.toWei('18000'));
        assertAlmostEqual(await vault.earned(user1), web3.utils.toWei('18000'));
        assertAlmostEqual(await vault.earned(user2), web3.utils.toWei('54000'));
    });

    it('Two stakers with the different (1:3) stakes wait 2 weeks', async function () {
        //
        // 1x: +----------------+ = 72k for 1w + 18k for 2w
        // 3x:         +--------+ =  0k for 1w + 54k for 2w
        //

        // 72000 reward tokens per week
        await controller.notifyReward(vault.address, web3.utils.toWei('72000'));

        await vault.deposit(web3.utils.toWei('1'), { from: user1 });
        
        await timeIncreaseTo(startTime.add(time.duration.weeks(1)));

        await vault.deposit(web3.utils.toWei('3'), { from: user2 });

        assertAlmostEqual(await vault.rewardPerToken(), web3.utils.toWei('72000'));
        assertAlmostEqual(await vault.earned(user1), web3.utils.toWei('72000'));
        assertAlmostEqual(await vault.earned(user2), web3.utils.toWei('0'));

        // Forward to week 3 and notifyReward weekly
        for (let i = 1; i < 3; i++) {
            await timeIncreaseTo(startTime.add(time.duration.weeks(i + 1)));
            await controller.notifyReward(vault.address, web3.utils.toWei('72000'));
        }

        assertAlmostEqual(await vault.rewardPerToken(), web3.utils.toWei('90000'));
        assertAlmostEqual(await vault.earned(user1), web3.utils.toWei('90000'));
        assertAlmostEqual(await vault.earned(user2), web3.utils.toWei('54000'));
    });

    it('Two stakers with the different (1:3) stakes after harvest wait 2 weeks', async function () {
        //
        // 1x: +----------------+ = 72k for 1w + 18k for 2w
        // 3x:         +--------+ =  0k for 1w + 54k for 2w
        //

        // 72000 reward tokens per week
        await controller.notifyReward(vault.address, web3.utils.toWei('72000'));

        await vault.deposit(web3.utils.toWei('1'), { from: user1 });
        
        await timeIncreaseTo(startTime.add(time.duration.weeks(1)));

        // The strategy has 2x return. User 2 must deposit 9 tokens to get a 1:3 percentage.
        await token.mint(strategy.address, web3.utils.toWei('2'));
        await vault.deposit(web3.utils.toWei('9'), { from: user2 });
        assert.strictEqual((await vault.totalSupply()).toString(), web3.utils.toWei('4'));
        assert.strictEqual((await vault.balance()).toString(), web3.utils.toWei('12'));
        assert.strictEqual((await vault.balanceOf(user1)).toString(), web3.utils.toWei('1'));
        assert.strictEqual((await vault.balanceOf(user2)).toString(), web3.utils.toWei('3'));

        assertAlmostEqual((await vault.rewardPerToken()).toString(), web3.utils.toWei('72000'));
        assertAlmostEqual((await vault.earned(user1)).toString(), web3.utils.toWei('72000'));
        assertAlmostEqual((await vault.earned(user2)).toString(), web3.utils.toWei('0'));

        // Forward to week 3 and notifyReward weekly
        for (let i = 1; i < 3; i++) {
            await timeIncreaseTo(startTime.add(time.duration.weeks(i + 1)));
            await controller.notifyReward(vault.address, web3.utils.toWei('72000'));
        }

        assertAlmostEqual((await vault.rewardPerToken()).toString(), web3.utils.toWei('90000'));
        assertAlmostEqual((await vault.earned(user1)).toString(), web3.utils.toWei('90000'));
        assertAlmostEqual((await vault.earned(user2)).toString(), web3.utils.toWei('54000'));
    });
    it('Three stakers with the different (1:3:5) stakes wait 3 weeks', async function () {
        //
        // 1x: +----------------+--------+ = 18k for 1w +  8k for 2w + 12k for 3w
        // 3x: +----------------+          = 54k for 1w + 24k for 2w +  0k for 3w
        // 5x:         +-----------------+ =  0k for 1w + 40k for 2w + 60k for 3w
        //

        // 72000 reward token per week for 3 weeks
        await controller.notifyReward(vault.address, web3.utils.toWei('72000'));

        await vault.deposit(web3.utils.toWei('1'), { from: user1 });
        await vault.deposit(web3.utils.toWei('3'), { from: user2 });
        
        await timeIncreaseTo(startTime.add(time.duration.weeks(1)));

        await vault.deposit(web3.utils.toWei('5'), { from: user3 });

        assertAlmostEqual(await vault.rewardPerToken(), web3.utils.toWei('18000'));
        assertAlmostEqual(await vault.earned(user1), web3.utils.toWei('18000'));
        assertAlmostEqual(await vault.earned(user2), web3.utils.toWei('54000'));

        await controller.notifyReward(vault.address, web3.utils.toWei('72000'));
        await timeIncreaseTo(startTime.add(time.duration.weeks(2)));

        assertAlmostEqual(await vault.rewardPerToken(), web3.utils.toWei('26000')); // 18k + 8k
        assertAlmostEqual(await vault.earned(user1), web3.utils.toWei('26000'));
        assertAlmostEqual(await vault.earned(user2), web3.utils.toWei('78000'));
        assertAlmostEqual(await vault.earned(user3), web3.utils.toWei('40000'));

        await vault.exit({ from: user2 });

        await controller.notifyReward(vault.address, web3.utils.toWei('72000'));
        await timeIncreaseTo(startTime.add(time.duration.weeks(3)));

        assertAlmostEqual(await vault.rewardPerToken(), web3.utils.toWei('38000')); // 18k + 8k + 12k
        assertAlmostEqual(await vault.earned(user1), web3.utils.toWei('38000'));
        assertAlmostEqual(await vault.earned(user2), web3.utils.toWei('0'));
        assertAlmostEqual(await vault.earned(user3), web3.utils.toWei('100000'));
        assertAlmostEqual(await vault.claims(user1), web3.utils.toWei('0'));
        assertAlmostEqual(await vault.claims(user2), web3.utils.toWei('78000'));
        assertAlmostEqual(await vault.claims(user3), web3.utils.toWei('0'));
    });

    it('One staker on 2 durations with gap', async function () {
        // 72000 reward token per week for 1 weeks
        await controller.notifyReward(vault.address, web3.utils.toWei('72000'));

        await vault.deposit(web3.utils.toWei('1'), { from: user1 });

        await timeIncreaseTo(startTime.add(time.duration.weeks(2)));

        assertAlmostEqual(await vault.rewardPerToken(), web3.utils.toWei('72000'));
        assertAlmostEqual(await vault.earned(user1), web3.utils.toWei('72000'));

        // 72000 reward token per week for 1 weeks
        await controller.notifyReward(vault.address, web3.utils.toWei('72000'));

        await timeIncreaseTo(startTime.add(time.duration.weeks(3)));

        assertAlmostEqual(await vault.rewardPerToken(), web3.utils.toWei('144000'));
        assertAlmostEqual(await vault.earned(user1), web3.utils.toWei('144000'));
    });
});