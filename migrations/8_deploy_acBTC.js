const BasketCoreProxy = artifacts.require("BasketCoreProxy");
const AcBTC = artifacts.require("AcBTC");

module.exports = function(deployer, network, accounts) {
    return BasketCoreProxy.deployed()
        .then(basketCoreProxy => deployer.deploy(AcBTC, basketCoreProxy.address));
    ;
};