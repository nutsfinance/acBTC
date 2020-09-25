const ACoconutSwap = artifacts.require("ACoconutSwap");
const ACoconutSwapProxy = artifacts.require("ACoconutSwapProxy");

const deployACoconutSwapProxy = async (deployer, accounts) => {
    const aCoconutSwap = (await ACoconutSwap.deployed()).address;

    await deployer.deploy(ACoconutSwapProxy, aCoconutSwap, accounts[0]);
}

module.exports = function (deployer, network, accounts) {
    deployer
        .then(() => deployACoconutSwapProxy(deployer, accounts))
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
};