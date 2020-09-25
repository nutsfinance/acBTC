const Account = artifacts.require("Account");

module.exports = function(deployer) {
  console.log("Deploying Account...");
  deployer.deploy(Account);
};
