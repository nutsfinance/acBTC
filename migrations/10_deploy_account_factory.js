const AccountFactory = artifacts.require("AccountFactory");

module.exports = function(deployer) {
  deployer.deploy(AccountFactory);
};
