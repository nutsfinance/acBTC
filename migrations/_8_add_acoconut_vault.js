const Controller = artifacts.require("Controller");
const ACoconutVault = artifacts.require("ACoconutVault");

const addACoconutVault = async (deployer, accounts) => {
    
    const controller = await Controller.deployed();
    const aCoconutVault = (await ACoconutVault.deployed()).address;

    await controller.addVault(aCoconutVault);
}

module.exports = function (deployer, network, accounts) {
    deployer
        .then(() => addACoconutVault(deployer, accounts))
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
};