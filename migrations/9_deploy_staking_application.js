const AccountFactory = artifacts.require("AccountFactory");
const StakingApplication = artifacts.require("StakingApplication");

const deployStakingApplication = async (deployer, accounts) => {
    
    const accountFactory = (await AccountFactory.deployed()).address;
    console.log("Deploying StakingApplication...");
    await deployer.deploy(StakingApplication, accountFactory);
}

module.exports = function (deployer, network, accounts) {
    deployer
        .then(() => deployStakingApplication(deployer, accounts))
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
};