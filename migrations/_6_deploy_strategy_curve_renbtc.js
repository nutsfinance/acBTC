const StrategyCurveRenBTC = artifacts.require("StrategyCurveRenBTC");
const ACoconutVault = artifacts.require("ACoconutVault");

const deployStrategyCurveRenBTC = async (deployer, accounts) => {
    
    const aCoconutVault = (await ACoconutVault.deployed()).address;
    console.log("Deploying StrategyCurveRenBTC...");
    await deployer.deploy(StrategyCurveRenBTC, aCoconutVault);
}

module.exports = function (deployer, network, accounts) {
    deployer
        .then(() => deployStrategyCurveRenBTC(deployer, accounts))
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
};