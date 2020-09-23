const { BN, expectRevert, time } = require('@openzeppelin/test-helpers');
const assert = require('assert');
const MockToken = artifacts.require("MockWBTC");
const MockRewardToken = artifacts.require("MockRenBTC");
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
    let vault;
    let strategy;
    let startTime;

    beforeEach(async () => {
        token = await MockToken.new();
        rewardToken = await MockRewardToken.new();
        vault = await RewardedVault.new(token.address, rewardToken.address);
        strategy = await Strategy.new(token.address, vault.address);
        await vault.setStrategy(strategy.address);

        await rewardToken.mint(owner, web3.utils.toWei('1000000'));
        await rewardToken.approve(vault.address, web3.utils.toWei('1000000'));
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

    it('Two stakers with the same stakes wait 1 w', async function () {
        // 72000 reward tokens per week for 3 weeks
        await vault.addRewardAmount(web3.utils.toWei('72000'), { from: owner });

        assertAlmostEqual(await vault.rewardPerToken(), '0');
        assert.equal(await vault.earned(user1), '0');
        assert.equal(await vault.earned(user2), '0');

        await vault.deposit(web3.utils.toWei('1'), { from: user1 });
        await vault.deposit(web3.utils.toWei('1'), { from: user2 });

        assertAlmostEqual(await vault.rewardPerToken(), '0');
        assert.equal(await vault.earned(user1), '0');
        assert.equal(await vault.earned(user2), '0');

        await timeIncreaseTo(startTime.add(time.duration.weeks(1)));

        assertAlmostEqual(await vault.rewardPerToken(), web3.utils.toWei('36000'));
        assertAlmostEqual(await vault.earned(user1), web3.utils.toWei('36000'));
        assertAlmostEqual(await vault.earned(user2), web3.utils.toWei('36000'));
    });

    it('Two stakers with the different (1:3) stakes wait 1 w', async function () {
        // 72000 reward tokens per week
        await vault.addRewardAmount(web3.utils.toWei('72000'), { from: owner });

        assertAlmostEqual(await vault.rewardPerToken(), '0');
        assert.equal(await vault.earned(user1), '0');
        assert.equal(await vault.earned(user2), '0');
        assert.equal(await vault.balanceOf(user1), '0');
        assert.equal(await vault.balanceOf(user2), '0');

        await vault.deposit(web3.utils.toWei('1'), { from: user1 });
        await vault.deposit(web3.utils.toWei('3'), { from: user2 });

        assertAlmostEqual(await vault.rewardPerToken(), '0');
        assert.equal(await vault.earned(user1), '0');
        assert.equal(await vault.earned(user2), '0');

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
        await vault.addRewardAmount(web3.utils.toWei('72000'), { from: owner });

        await vault.deposit(web3.utils.toWei('1'), { from: user1 });
        
        await timeIncreaseTo(startTime.add(time.duration.weeks(1)));

        await vault.deposit(web3.utils.toWei('3'), { from: user2 });

        assertAlmostEqual(await vault.rewardPerToken(), web3.utils.toWei('72000'));
        assertAlmostEqual(await vault.earned(user1), web3.utils.toWei('72000'));
        assertAlmostEqual(await vault.earned(user2), web3.utils.toWei('0'));

        // Forward to week 3 and notifyReward weekly
        for (let i = 1; i < 3; i++) {
            await timeIncreaseTo(startTime.add(time.duration.weeks(i + 1)));
            await vault.addRewardAmount(web3.utils.toWei('72000'), { from: owner });
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
        await vault.addRewardAmount(web3.utils.toWei('72000'), { from: owner });

        await vault.deposit(web3.utils.toWei('1'), { from: user1 });
        
        await timeIncreaseTo(startTime.add(time.duration.weeks(1)));

        // The strategy has 2x return. User 2 must deposit 9 tokens to get a 1:3 percentage.
        await token.mint(strategy.address, web3.utils.toWei('2'));
        await vault.deposit(web3.utils.toWei('9'), { from: user2 });
        assert.equal(await vault.totalSupply(), web3.utils.toWei('4'));
        assert.equal(await vault.balance(), web3.utils.toWei('12'));
        assert.equal(await vault.balanceOf(user1), web3.utils.toWei('1'));
        assert.equal(await vault.balanceOf(user2), web3.utils.toWei('3'));

        assertAlmostEqual(await vault.rewardPerToken(), web3.utils.toWei('72000'));
        assertAlmostEqual(await vault.earned(user1), web3.utils.toWei('72000'));
        assertAlmostEqual(await vault.earned(user2), web3.utils.toWei('0'));

        // Forward to week 3 and notifyReward weekly
        for (let i = 1; i < 3; i++) {
            await timeIncreaseTo(startTime.add(time.duration.weeks(i + 1)));
            await vault.addRewardAmount(web3.utils.toWei('72000'), { from: owner });
        }

        assertAlmostEqual(await vault.rewardPerToken(), web3.utils.toWei('90000'));
        assertAlmostEqual(await vault.earned(user1), web3.utils.toWei('90000'));
        assertAlmostEqual(await vault.earned(user2), web3.utils.toWei('54000'));
    });
    it('Three stakers with the different (1:3:5) stakes wait 3 weeks', async function () {
        //
        // 1x: +----------------+--------+ = 18k for 1w +  8k for 2w + 12k for 3w
        // 3x: +----------------+          = 54k for 1w + 24k for 2w +  0k for 3w
        // 5x:         +-----------------+ =  0k for 1w + 40k for 2w + 60k for 3w
        //

        // 72000 reward token per week for 3 weeks
        await vault.addRewardAmount(web3.utils.toWei('72000'), { from: owner });

        await vault.deposit(web3.utils.toWei('1'), { from: user1 });
        await vault.deposit(web3.utils.toWei('3'), { from: user2 });
        
        await timeIncreaseTo(startTime.add(time.duration.weeks(1)));

        await vault.deposit(web3.utils.toWei('5'), { from: user3 });

        assertAlmostEqual(await vault.rewardPerToken(), web3.utils.toWei('18000'));
        assertAlmostEqual(await vault.earned(user1), web3.utils.toWei('18000'));
        assertAlmostEqual(await vault.earned(user2), web3.utils.toWei('54000'));

        await vault.addRewardAmount(web3.utils.toWei('72000'), { from: owner });
        await timeIncreaseTo(startTime.add(time.duration.weeks(2)));

        assertAlmostEqual(await vault.rewardPerToken(), web3.utils.toWei('26000')); // 18k + 8k
        assertAlmostEqual(await vault.earned(user1), web3.utils.toWei('26000'));
        assertAlmostEqual(await vault.earned(user2), web3.utils.toWei('78000'));
        assertAlmostEqual(await vault.earned(user3), web3.utils.toWei('40000'));

        await vault.exit({ from: user2 });

        await vault.addRewardAmount(web3.utils.toWei('72000'), { from: owner });
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
        await vault.addRewardAmount(web3.utils.toWei('72000'), { from: owner });

        await vault.deposit(web3.utils.toWei('1'), { from: user1 });

        await timeIncreaseTo(startTime.add(time.duration.weeks(2)));

        assertAlmostEqual(await vault.rewardPerToken(), web3.utils.toWei('72000'));
        assertAlmostEqual(await vault.earned(user1), web3.utils.toWei('72000'));

        // 72000 reward token per week for 1 weeks
        await vault.addRewardAmount(web3.utils.toWei('72000'), { from: owner });

        await timeIncreaseTo(startTime.add(time.duration.weeks(3)));

        assertAlmostEqual(await vault.rewardPerToken(), web3.utils.toWei('144000'));
        assertAlmostEqual(await vault.earned(user1), web3.utils.toWei('144000'));
    });
});