const AccountFactory = artifacts.require("AccountFactory");
const BasketManagerProxy = artifacts.require("BasketManagerProxy");
const MintRedeemApplication = artifacts.require("MintRedeemApplication");

const deployBasetApplication = async (deployer, accounts) => {
    const accountFactory = await AccountFactory.deployed();
    const basketManagerProxy = await BasketManagerProxy.deployed();
    const mintRedeemApplication = await deployer.deploy(MintRedeemApplication, basketManagerProxy.address, accountFactory.address);
    console.log("Account factory: " + accountFactory.address);
    console.log("Mint redeem application: " + mintRedeemApplication.address);
}

module.exports = function (deployer, network, accounts) {
    deployer
        .then(() => deployBasetApplication(deployer, accounts))
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
};