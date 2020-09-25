const Account = artifacts.require("Account");
const AccountFactory = artifacts.require("AccountFactory");

const deployAccountFactory = async (deployer, accounts) => {
    const account = (await Account.deployed()).address;
    console.log("Deploying AccountFactory...");
    await deployer.deploy(AccountFactory, account);
}

module.exports = function (deployer, network, accounts) {
    deployer
        .then(() => deployAccountFactory(deployer, accounts))
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
};