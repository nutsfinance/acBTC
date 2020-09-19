const ACoconutExchange = artifacts.require("ACoconutExchange");
const ACoconutExchangeProxy = artifacts.require("ACoconutExchangeProxy");

const deployACoconutExchangeProxy = async (deployer, accounts) => {
    const aCoconutExchange = (await ACoconutExchange.deployed()).address;

    await deployer.deploy(ACoconutExchangeProxy, aCoconutExchange, accounts[0]);
}

module.exports = function (deployer, network, accounts) {
    deployer
        .then(() => deployACoconutExchangeProxy(deployer, accounts))
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
};