const ACoconutSwap = artifacts.require("ACoconutSwap");

module.exports = function(deployer) {
  console.log("Deploying ACoconutSwap...");
  deployer.deploy(ACoconutSwap);
};
