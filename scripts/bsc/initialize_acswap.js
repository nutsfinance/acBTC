const ACoconutSwap = artifacts.require("ACoconutSwap");
const ACoconutBTC = artifacts.require("ACoconutBTC");
const ACoconutSwapProxy = artifacts.require("ACoconutSwapProxy");
const ACoconutBTCProxy = artifacts.require("ACoconutBTCProxy");
const ACoconutMakerProxy = artifacts.require("ACoconutMakerProxy");
const ERC20Upgradeable = artifacts.require("ERC20Upgradeable");

const BTCB = '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c';  // 18
const ACBTC_ETH = '0x639A647fbe20b6c8ac19E48E2de44ea792c62c5C'; // 18
const toWei = web3.utils.toWei;

module.exports = async function (callback) {
    try {
        const btcb = await ERC20Upgradeable.at(BTCB);
        const acBTC_ETH = await ERC20Upgradeable.at(ACBTC_ETH);
        const acBTCProxy = await ACoconutBTCProxy.deployed();
        const acSwapProxy = await ACoconutSwapProxy.deployed();
        const acMakerProxy = await ACoconutMakerProxy.deployed();
        const acBTC = await ACoconutBTC.at(acBTCProxy.address);
        const acSwap = await ACoconutSwap.at(acSwapProxy.address);

        await acSwap.initialize([BTCB, ACBTC_ETH], ['1', '1'], [0, 2000000, 10000000], acMakerProxy.address, acBTC.address, 100);
        await btcb.approve(acSwap.address, toWei("0.001"));
        await acBTC_ETH.approve(acSwap.address, toWei("0.001"));
        await acBTC.setMinter(acSwap.address, true);
        await acSwap.unpause();
        await acSwap.mint([toWei("0.001"), toWei("0.001")], toWei("0.002"));

        callback();
    } catch (e) {
        callback(e);
    }
}