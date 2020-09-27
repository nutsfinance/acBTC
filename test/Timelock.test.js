const { BN, expectRevert, time } = require('@openzeppelin/test-helpers');
const assert = require('assert');
const Timelock = artifacts.require("Timelock");

contract("Timelock", async ([owner, admin, newAdmin, user]) => {
    let timelock;
    const delay = 3600 * 24 * 7;    // 7 days
    const newDelay = 3600 * 24 * 5;    // 5 days

    beforeEach(async () => {
        timelock = await Timelock.new(admin, delay);
    });

    it("should initialize parameters", async () => {
        console.log(await timelock.admin());
        console.log();
        assert.strictEqual(await timelock.admin(), admin);
        assert.strictEqual((await timelock.delay()).toNumber(), delay);
        assert.strictEqual(await timelock.pendingAdmin(), '0x0000000000000000000000000000000000000000');
    });
    it("should only allow timelock to set delay", async () => {
        await expectRevert(timelock.setDelay(delay), "Timelock::setDelay: Call must come from Timelock.");
    });
    it("should only allow timelock to set pending admin", async () => {
        await expectRevert(timelock.setPendingAdmin(newAdmin), "Timelock::setPendingAdmin: Call must come from Timelock.");
    });
    it("should require admin to queue transactions", async () => {
        const data = web3.eth.abi.encodeParameter('uint256', newDelay);
        const eta = (await time.latest()) + delay + 100;
        await expectRevert(timelock.queueTransaction(timelock.address, 0, 'setDelay(uint256)', data, eta),
            "Timelock::queueTransaction: Call must come from admin.");
    });
    it("should require eta to exceed delay", async () => {
        const data = web3.eth.abi.encodeParameter('uint256', newDelay);
        const eta = (await time.latest()).toNumber() + delay - 200;
        // console.log((await time.latest()).toNumber());
        // console.log(eta);
        await expectRevert(timelock.queueTransaction(timelock.address, 0, 'setDelay(uint256)', data, eta, {from: admin}),
            "Timelock::queueTransaction: Estimated execution block must satisfy delay.");
    });
    it("should be able to enqueue transactions", async () => {
        const data = web3.eth.abi.encodeParameter('uint256', newDelay);
        const eta = (await time.latest()) + delay + 1000;
        const txHash = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(['address','uint256','string','bytes','uint256'],
            [timelock.address, 0, 'setDelay(uint256)', data, eta]));
        assert.strictEqual(await timelock.queuedTransactions(txHash), false);
        await timelock.queueTransaction(timelock.address, 0, 'setDelay(uint256)', data, eta, {from: admin});
        assert.strictEqual(await timelock.queuedTransactions(txHash), true);
    });
    it("should require admin to cancel transactions", async () => {
        const data = web3.eth.abi.encodeParameter('uint256', newDelay);
        const eta = (await time.latest()) + delay + 1000;
        const txHash = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(['address','uint256','string','bytes','uint256'],
            [timelock.address, 0, 'setDelay(uint256)', data, eta]));
        await timelock.queueTransaction(timelock.address, 0, 'setDelay(uint256)', data, eta, {from: admin});
        await expectRevert(timelock.cancelTransaction(timelock.address, 0, 'setDelay(uint256)', data, eta),
            "Timelock::cancelTransaction: Call must come from admin.");
    });
    it("should be able to cancel transactions", async () => {
        const data = web3.eth.abi.encodeParameter('uint256', newDelay);
        const eta = (await time.latest()) + delay + 1000;
        const txHash = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(['address','uint256','string','bytes','uint256'],
            [timelock.address, 0, 'setDelay(uint256)', data, eta]));
        assert.strictEqual(await timelock.queuedTransactions(txHash), false);
        await timelock.queueTransaction(timelock.address, 0, 'setDelay(uint256)', data, eta, {from: admin});
        assert.strictEqual(await timelock.queuedTransactions(txHash), true);
        await timelock.cancelTransaction(timelock.address, 0, 'setDelay(uint256)', data, eta, {from: admin});
        assert.strictEqual(await timelock.queuedTransactions(txHash), false);
    });
    it("should require admin to execute transactions", async () => {
        const data = web3.eth.abi.encodeParameter('uint256', newDelay);
        const eta = (await time.latest()) + delay + 1000;
        const txHash = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(['address','uint256','string','bytes','uint256'],
            [timelock.address, 0, 'setDelay(uint256)', data, eta]));
        await timelock.queueTransaction(timelock.address, 0, 'setDelay(uint256)', data, eta, {from: admin});
        await expectRevert(timelock.executeTransaction(timelock.address, 0, 'setDelay(uint256)', data, eta),
            "Timelock::executeTransaction: Call must come from admin.");
    });
    it("should pass eta to execute transactions", async () => {
        const data = web3.eth.abi.encodeParameter('uint256', newDelay);
        const eta = (await time.latest()) + delay + 1000;
        const txHash = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(['address','uint256','string','bytes','uint256'],
            [timelock.address, 0, 'setDelay(uint256)', data, eta]));
        await timelock.queueTransaction(timelock.address, 0, 'setDelay(uint256)', data, eta, {from: admin});
        await expectRevert(timelock.executeTransaction(timelock.address, 0, 'setDelay(uint256)', data, eta, {from: admin}),
            "Timelock::executeTransaction: Transaction hasn't surpassed time lock.");
    });
    it("should be able to execute transactions", async () => {
        const data = web3.eth.abi.encodeParameter('uint256', newDelay);
        const eta = (await time.latest()).toNumber() + delay + 1000;
        const txHash = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(['address','uint256','string','bytes','uint256'],
            [timelock.address, 0, 'setDelay(uint256)', data, eta]));
        assert.strictEqual(await timelock.queuedTransactions(txHash), false);
        await timelock.queueTransaction(timelock.address, 0, 'setDelay(uint256)', data, eta, {from: admin});
        assert.strictEqual(await timelock.queuedTransactions(txHash), true);
        assert.strictEqual((await timelock.delay()).toNumber(), delay);
        await time.increaseTo(eta + 100);
        await timelock.executeTransaction(timelock.address, 0, 'setDelay(uint256)', data, eta, {from: admin});
        assert.strictEqual(await timelock.queuedTransactions(txHash), false);
        assert.strictEqual((await timelock.delay()).toNumber(), newDelay);
    });
    it("should allow timelock to set pending admin", async () => {
        const data = web3.eth.abi.encodeParameter('address', newAdmin);
        const eta = (await time.latest()).toNumber() + delay + 1000;
        const txHash = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(['address','uint256','string','bytes','uint256'],
            [timelock.address, 0, 'setPendingAdmin(address)', data, eta]));
        assert.strictEqual(await timelock.queuedTransactions(txHash), false);
        await timelock.queueTransaction(timelock.address, 0, 'setPendingAdmin(address)', data, eta, {from: admin});
        assert.strictEqual(await timelock.queuedTransactions(txHash), true);
        assert.strictEqual(await timelock.pendingAdmin(), '0x0000000000000000000000000000000000000000');
        await time.increaseTo(eta + 100);
        await timelock.executeTransaction(timelock.address, 0, 'setPendingAdmin(address)', data, eta, {from: admin});
        assert.strictEqual(await timelock.queuedTransactions(txHash), false);
        assert.strictEqual(await timelock.pendingAdmin(), newAdmin);
    });
    it("should only allow pending admin to accept admin", async () => {
        const data = web3.eth.abi.encodeParameter('address', newAdmin);
        const eta = (await time.latest()).toNumber() + delay + 1000;
        const txHash = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(['address','uint256','string','bytes','uint256'],
            [timelock.address, 0, 'setPendingAdmin(address)', data, eta]));
        await timelock.queueTransaction(timelock.address, 0, 'setPendingAdmin(address)', data, eta, {from: admin});
        assert.strictEqual(await timelock.pendingAdmin(), '0x0000000000000000000000000000000000000000');
        await time.increaseTo(eta + 100);
        await timelock.executeTransaction(timelock.address, 0, 'setPendingAdmin(address)', data, eta, {from: admin});
        assert.strictEqual(await timelock.pendingAdmin(), newAdmin);

        await expectRevert(timelock.acceptAdmin({from: admin}), "Timelock::acceptAdmin: Call must come from pendingAdmin.");
    });

    it("should allow pending admin to accept admin", async () => {
        const data = web3.eth.abi.encodeParameter('address', newAdmin);
        const eta = (await time.latest()).toNumber() + delay + 1000;
        const txHash = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(['address','uint256','string','bytes','uint256'],
            [timelock.address, 0, 'setPendingAdmin(address)', data, eta]));
        await timelock.queueTransaction(timelock.address, 0, 'setPendingAdmin(address)', data, eta, {from: admin});
        assert.strictEqual(await timelock.pendingAdmin(), '0x0000000000000000000000000000000000000000');
        await time.increaseTo(eta + 100);
        await timelock.executeTransaction(timelock.address, 0, 'setPendingAdmin(address)', data, eta, {from: admin});
        
        assert.strictEqual(await timelock.admin(), admin);
        assert.strictEqual(await timelock.pendingAdmin(), newAdmin);
        await timelock.acceptAdmin({from: newAdmin});
        assert.strictEqual(await timelock.admin(), newAdmin);
        assert.strictEqual(await timelock.pendingAdmin(), '0x0000000000000000000000000000000000000000');
    });
});