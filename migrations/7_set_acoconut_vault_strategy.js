const ACoconutVault = artifacts.require("ACoconutVault");
const StrategyCurveRenBTC = artifacts.require("StrategyCurveRenBTC");

const setACoconutVaultStrategy = async (deployer, accounts) => {
    
    const aCoconutVault = await ACoconutVault.deployed();
    const strategyCurveRenBTC = await StrategyCurveRenBTC.deployed();
    console.log("Setting ACoconutVault strategy...");
    if (process.env.MAINNET || process.env.MAINNET_FORK) {
        await aCoconutVault.setStrategy(strategyCurveRenBTC.address);
    }
}

module.exports = function (deployer, network, accounts) {
    deployer
        .then(() => setACoconutVaultStrategy(deployer, accounts))
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
};