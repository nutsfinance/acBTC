const ACoconutMaker = artifacts.require("ACoconutMaker");
const ACoconutMakerProxy = artifacts.require("ACoconutMakerProxy");

const ACOCONUT_BTC = '0xeF6e45af9a422c5469928F927ca04ed332322e2e';

module.exports = async function (callback) {
    try {
        const accounts = await web3.eth.getAccounts();
        
        // const aCoconutMakerImpl = await ACoconutMaker.new();
        const aCoconutMakerImpl = await ACoconutMaker.at('0xab21C2de0ff51E41E21B39e1B9dcc123F1532f98');
        const aCoconutMakerProxy = await ACoconutMakerProxy.new(aCoconutMakerImpl.address, accounts[1], Buffer.from(''));

        const aCoconutMaker = await ACoconutMaker.at(aCoconutMakerProxy.address);
        await aCoconutMaker.initialize(ACOCONUT_BTC);

        console.log(`aCoconutMaker: ${aCoconutMaker.address}`);
        console.log(`aCoconutMaker impl: ${aCoconutMakerImpl.address}`);
        callback();
    } catch (e) {
        callback(e);
    }
}