const ACoconutSwap = artifacts.require("ACoconutSwap");
const ACoconutSwapProxy = artifacts.require("ACoconutSwapProxy");
const MockWBTC = artifacts.require("MockWBTC");
const MockRenBTC = artifacts.require("MockRenBTC");
const ACoconutBTC = artifacts.require("ACoconutBTC");
const ACoconut = artifacts.require("ACoconut");
const AccountFactory = artifacts.require("AccountFactory");

const initializeACoconutSwap = async (deployer, accounts) => {
    // TODO Change to real address in production
    const wBTC = await deployer.deploy(MockWBTC);
    // const renBTC = await deployer.deploy(MockRenBTC);
    const renBTC = await MockRenBTC.at("0x0a9add98c076448cbcfacf5e457da12ddbef4a8f");
    const acBTC = await ACoconutBTC.deployed();
    const ac = await ACoconut.deployed();
    const accountFactory = await AccountFactory.deployed();

    // TODO Change to a real address later
    const aCoconutSwapProxy = await ACoconutSwapProxy.deployed();
    const aCoconutSwap = await ACoconutSwap.at(aCoconutSwapProxy.address);

    await aCoconutSwap.initialize([wBTC.address, renBTC.address], [1, 1], [0, 0, 0], acBTC.address, 100);

    await acBTC.setMinter(aCoconutSwapProxy.address, true);

    console.log('WBTC: ' + wBTC.address);
    console.log('renBTC: ' + renBTC.address);
    console.log('ACoconut: ' + ac.address);
    console.log('ACoconutBTC: ' + acBTC.address);
    console.log('Account Factory: ' + accountFactory.address);
    console.log('ACoconut Swap: ' + aCoconutSwapProxy.address);
}

module.exports = function (deployer, network, accounts) {
    deployer
        .then(() => initializeACoconutSwap(deployer, accounts))
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
};
