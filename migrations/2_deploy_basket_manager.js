const BasketManager = artifacts.require("BasketManager");

module.exports = function(deployer) {
  deployer.deploy(BasketManager);
};
