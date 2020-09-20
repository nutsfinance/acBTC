const AccountFactory = artifacts.require("AccountFactory");
const ACoconutVault = artifacts.require("ACoconutVault");
const StakingApplication = artifacts.require("StakingApplication");

const deployStakingApplication = async (deployer, accounts) => {
    
    const accountFactory = (await AccountFactory.deployed()).address;
    const aCoconutVault = (await ACoconutVault.deployed()).address;
    const stakingApplication = (await deployer.deploy(StakingApplication, accountFactory, aCoconutVault)).address;

    console.log('Account factory: ' + accountFactory);
    console.log('Staking application: ' + stakingApplication);
}

module.exports = function (deployer, network, accounts) {
    deployer
        .then(() => deployStakingApplication(deployer, accounts))
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
};