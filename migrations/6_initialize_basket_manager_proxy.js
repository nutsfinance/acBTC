const BasketManagerProxy = artifacts.require("BasketManagerproxy");
const BasketManager = artifacts.require("BasketManager");
const BasketCoreProxy = artifacts.require("BasketCoreProxy");

const initializeBasketManager = async (deployer, accounts) => {
    const basketManagerProxy = await BasketManagerProxy.deployed();
    const basketManager = await BasketManager.at(basketManagerProxy.address);
    const basketCoreProxy = await BasketCoreProxy.deployed();

    await basketManager.initialize(basketCoreProxy.address);
}

module.exports = function (deployer, network, accounts) {
    deployer
        .then(() => initializeBasketManager(deployer, accounts))
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
};