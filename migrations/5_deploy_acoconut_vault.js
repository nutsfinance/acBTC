const { time } = require('@openzeppelin/test-helpers');
const ACoconutVault = artifacts.require("ACoconutVault");
const MockRenCrv = artifacts.require("MockRenCrv");
const Controller = artifacts.require("Controller");

const deployACoconutVault = async (deployer, accounts) => {

    let renCrv = '0x49849C98ae39Fff122806C06791Fa73784FB3675';  // want token
    if (!process.env.MAINNET && !process.env.MAINNET_FORK) {
        renCrv = (await deployer.deploy(MockRenCrv)).address;
    }
    const controller = (await Controller.deployed()).address;
    const current = (await time.latest()).toNumber();
    console.log("Deploying ACoconutVault...");
    await deployer.deploy(ACoconutVault, "ACoconut BTC Vault", "acBTCv", controller, renCrv, current + 3600 * 24 * 15);   // Can migrate after 15 days
}

module.exports = function (deployer, network, accounts) {
    deployer
        .then(() => deployACoconutVault(deployer, accounts))
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
};