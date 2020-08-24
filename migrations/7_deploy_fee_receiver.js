const FeeReceiver = artifacts.require("FeeReceiver");

module.exports = function(deployer) {
  deployer.deploy(FeeReceiver);
};
