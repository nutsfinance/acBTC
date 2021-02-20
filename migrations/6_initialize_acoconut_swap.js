const ACoconutSwap = artifacts.require("ACoconutSwap");
const ACoconutSwapProxy = artifacts.require("ACoconutSwapProxy");
const MockWBTC = artifacts.require("MockWBTC");
const MockRenBTC = artifacts.require("MockRenBTC");
const ACoconutBTC = artifacts.require("ACoconutBTC");
const ACoconut = artifacts.require("ACoconut");

const initializeACoconutSwap = async (deployer, accounts) => {
    // TODO Change to real address in production
    // const wBTC = await deployer.deploy(MockWBTC);
    // const renBTC = await deployer.deploy(MockRenBTC);
    const wBTC = await MockWBTC.at('0xF26d963a0420F285cBa59dC6C0a65e34E55C8396');
    const renBTC = await MockRenBTC.at("0xDC3bEC090E595D8DB22B8Fdf1904331984D87cdc");
    const acBTC = await ACoconutBTC.deployed();
    const ac = await ACoconut.deployed();

    // TODO Change to a real address later
    const aCoconutSwapProxy = await ACoconutSwapProxy.deployed();
    const aCoconutSwap = await ACoconutSwap.at(aCoconutSwapProxy.address);

    await aCoconutSwap.initialize([wBTC.address, renBTC.address], [1, 1], [0, 0, 0], acBTC.address, 100);

    await acBTC.setMinter(aCoconutSwapProxy.address, true);
    await aCoconutSwap.unpause();
    await wBTC.mint(accounts[0], '1000000000');
    await renBTC.mint(accounts[0], '1000000000');
    await wBTC.approve(aCoconutSwap.address, '1000000000');
    await renBTC.approve(aCoconutSwap.address, '1000000000');
    await aCoconutSwap.mint(['1000000000', '1000000000'], '2000000000');

    console.log('WBTC: ' + wBTC.address);
    console.log('renBTC: ' + renBTC.address);
    console.log('ACoconut: ' + ac.address);
    console.log('ACoconutBTC: ' + acBTC.address);
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
