const argv = require('yargs').argv;
const AccountFactory = artifacts.require("AccountFactory");
const MintRedeemApplication = artifacts.require("MintRedeemApplication");

module.exports = async function (callback) {
    try {
        const accountFactory = await AccountFactory.deployed();
        const mintRedeemApplication = await MintRedeemApplication.deployed();
        await accountFactory.createAccount([mintRedeemApplication.address], {from: argv.account});
        const accountAddress = await accountFactory.getAccount(argv.account);
        console.log("Account: " + accountAddress);

        callback();
    } catch (e) {
        callback(e);
    }
}