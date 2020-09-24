const ACoconutVault = artifacts.require("ACoconutVault");
const MockRenCrv = artifacts.require("MockRenCrv");
const ACoconut = artifacts.require("ACoconut");

const deployACoconutVault = async (deployer, accounts) => {

    let renCrv = '0x49849C98ae39Fff122806C06791Fa73784FB3675';  // want token
    if (!process.env.MAINNET && !process.env.MAINNET_FORK) {
        renCrv = (await deployer.deploy(MockRenCrv)).address;
    }
    const aCoconut = (await ACoconut.deployed()).address;   // reward token
    await deployer.deploy(ACoconutVault, 3600 * 14, renCrv, aCoconut);
}

module.exports = function (deployer, network, accounts) {
    deployer
        .then(() => deployACoconutVault(deployer, accounts))
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
};