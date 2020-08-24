const BasketCoreProxy = artifacts.require("BasketCoreProxy");
const BasketCore = artifacts.require("BasketCore");

module.exports = function(deployer, network, accounts) {
  // accounts[1] is the proxy admin address.
  return BasketCore.deployed()
    .then(basketCore => deployer.deploy(BasketCoreProxy, basketCore.address, accounts[1]));
};
