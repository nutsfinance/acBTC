const Controller = artifacts.require("Controller");
const ACoconut = artifacts.require("ACoconut");

const deployController = async (deployer, accounts) => {
    
    const aCoconut = (await ACoconut.deployed()).address;   // reward token
    console.log("Deploying Controller...");
    await deployer.deploy(Controller, aCoconut);
}

module.exports = function (deployer, network, accounts) {
    deployer
        .then(() => deployController(deployer, accounts))
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
};