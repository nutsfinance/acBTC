const ACoconutVault = artifacts.require("ACoconutVault");
const MockRenCrv = artifacts.require("MockRenCrv");
const ACoconut = artifacts.require("ACoconut");

const deployACoconutVault = async (deployer, accounts) => {
    // TODO Replace with real renCrv
    const renCrv = (await deployer.deploy(MockRenCrv)).address;
    const aCoconut = (await ACoconut.deployed()).address;
    await deployer.deploy(ACoconutVault, 3600 * 14, aCoconut, renCrv);
}

module.exports = function (deployer, network, accounts) {
    deployer
        .then(() => deployACoconutVault(deployer, accounts))
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
};