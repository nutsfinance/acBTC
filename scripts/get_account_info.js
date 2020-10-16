const argv = require('yargs').argv;
const AccountFactory = artifacts.require("AccountFactory");
const ERC20 = artifacts.require("ERC20");
const ACoconutVault = artifacts.require("ACoconutVault");

module.exports = async function (callback) {
    try {
        const accountFactory = await AccountFactory.at('0x34d50B679Bb74a3d4D27A82594e527Aea78ec548');
        const renCrv = await ERC20.at('0x49849C98ae39Fff122806C06791Fa73784FB3675');
        const ac = await ERC20.at('0x9A0aBA393aac4dFbFf4333B06c407458002C6183');
        const ethac = await ERC20.at('0x6660551884b1ccc968662d72c2e6897a1ca4bfac');
        const pool1 = await ACoconutVault.at('0x1eB47C01cfAb26D2346B449975b7BF20a34e0d45');
        const pool2 = await ACoconutVault.at('0xF2c6706af78d15549c9376d04E40957A3B357de4');

        const events = await accountFactory.getPastEvents('AccountCreated', {filter: {userAddress: argv.address}, fromBlock: 1});
        console.log('Wallet address: ' + argv.address);
        for (const event of events) {
            const account = event.returnValues.accountAddress;
            console.log('Account address: ' + account);
            console.log('\t - renCrv: ' + await renCrv.balanceOf(account));
            console.log('\t - AC: ' + await ac.balanceOf(account));
            console.log('\t - UNI-ETH-AC: ' + await ethac.balanceOf(account));
            console.log('\t - Pool 1: ' + await pool1.balanceOf(account));
            console.log('\t - Pool 2: ' + await pool2.balanceOf(account));
        }

        callback();
    } catch (e) {
        callback(e);
    }
}