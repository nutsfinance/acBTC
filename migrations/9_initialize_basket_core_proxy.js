const BasketManagerProxy = artifacts.require("BasketManagerProxy");
const BasketCore = artifacts.require("BasketCore");
const BasketCoreProxy = artifacts.require("BasketCoreProxy");
const FeeReceiver = artifacts.require("FeeReceiver");
const AcBTC = artifacts.require("AcBTC");

const initializeBasketCore = async (deployer, accounts) => {
    const basketCoreProxy = await BasketCoreProxy.deployed();
    const basketCore = await BasketCore.at(basketCoreProxy.address);
    const basketManagerProxy = await BasketManagerProxy.deployed();
    const feeReceiver = await FeeReceiver.deployed();
    const acBTC = await AcBTC.deployed();

    await basketCore.initialize(basketManagerProxy.address, feeReceiver.address, acBTC.address);
    console.log('Basket core: ' + basketCoreProxy.address);
    console.log('Basket manager: ' + basketManagerProxy.address);
}

module.exports = function (deployer, network, accounts) {
    deployer
        .then(() => initializeBasketCore(deployer, accounts))
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
};