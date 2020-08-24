const BasketCore = artifacts.require("BasketCore");

module.exports = function(deployer) {
  deployer.deploy(BasketCore);
};
