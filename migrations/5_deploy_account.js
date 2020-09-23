const Account = artifacts.require("Account");

module.exports = function(deployer) {
  deployer.deploy(Account);
};
