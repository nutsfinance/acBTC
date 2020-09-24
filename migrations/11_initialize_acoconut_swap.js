const ACoconutSwap = artifacts.require("ACoconutSwap");
const ACoconutSwapProxy = artifacts.require("ACoconutSwapProxy");
const MockWBTC = artifacts.require("MockWBTC");
const MockRenBTC = artifacts.require("MockRenBTC");
const ACoconutBTC = artifacts.require("ACoconutBTC");

const initializeACoconutSwap = async (deployer, accounts) => {
    // TODO Change to real address in production
    const wBTC = (await deployer.deploy(MockWBTC)).address;
    const renBTC = (await deployer.deploy(MockRenBTC)).address;
    const acBTC = (await ACoconutBTC.deployed()).address;

    // TODO Change to a real address later
    const feeRecipient = accounts[1];
    const aCoconutSwapProxy = (await ACoconutSwapProxy.deployed()).address;
    const aCoconutSwap = await ACoconutSwap.at(aCoconutSwapProxy);

    await aCoconutSwap.initialize([wBTC, renBTC], [1, 1], [0, 0, 0], acBTC, feeRecipient, 100);
}

module.exports = function (deployer, network, accounts) {
    deployer
        .then(() => initializeACoconutSwap(deployer, accounts))
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
};