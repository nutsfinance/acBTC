const AccountFactory = artifacts.require("AccountFactory");
const ACoconutVault = artifacts.require("ACoconutVault");
const StakingApplication = artifacts.require("StakingApplication");
const ACoconut = artifacts.require("ACoconut");
const ACoconutBTC = artifacts.require("ACoconutBTC");

const deployStakingApplication = async (deployer, accounts) => {
    
    const accountFactory = (await AccountFactory.deployed()).address;
    const aCoconutVault = (await ACoconutVault.deployed()).address;
    const aCoconut = (await ACoconut.deployed()).address;
    const aCoconutBTC = (await ACoconutBTC.deployed()).address;
    const stakingApplication = (await deployer.deploy(StakingApplication, accountFactory, aCoconutVault)).address;

    console.log('ACoconut: ' + aCoconut);
    console.log('ACoconutBTC: ' + aCoconutBTC);
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