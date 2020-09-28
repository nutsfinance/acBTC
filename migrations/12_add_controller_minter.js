const ACoconut = artifacts.require("ACoconut");
const Controller = artifacts.require("Controller");

const addControllerMinter = async (deployer, accounts) => {
    const aCoconut = await ACoconut.deployed();
    const controller = await Controller.deployed();
    console.log("Adding ACoconut minter role to controller...");
    await aCoconut.setMinter(controller.address, true);
}

module.exports = function (deployer, network, accounts) {
    deployer
        .then(() => addControllerMinter(deployer, accounts))
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
};