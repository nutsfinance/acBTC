const BasketManagerProxy = artifacts.require("BasketManagerProxy");
const BasketManager = artifacts.require("BasketManager");

module.exports = function(deployer, network, accounts) {
    // accounts[1] is the proxy admin address
    return BasketManager.deployed()
        .then(basketManager => deployer.deploy(BasketManagerProxy, basketManager.address, accounts[1]));
    ;
};