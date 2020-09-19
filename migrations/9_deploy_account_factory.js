const Account = artifacts.require("Account");
const AccountFactory = artifacts.require("AccountFactory");

const deployAccountFactory = async (deployer, accounts) => {
    
    const account = (await Account.deployed()).address;
    const accountFactory = await deployer.deploy(AccountFactory, account);
    // const tx = await accountFactory.createAccount([accounts[1]]);
    // console.log(tx);
}

module.exports = function (deployer, network, accounts) {
    deployer
        .then(() => deployAccountFactory(deployer, accounts))
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
};