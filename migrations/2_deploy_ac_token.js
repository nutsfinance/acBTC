const ACoconut = artifacts.require("ACoconut");

module.exports = function(deployer) {
  console.log("Deploying ACoconut...");
  deployer.deploy(ACoconut);
};
