const ACoconutBTC = artifacts.require("ACoconutBTC");

module.exports = function(deployer) {
  console.log("Deploying ACoconutBTC...");
  deployer.deploy(ACoconutBTC);
};
