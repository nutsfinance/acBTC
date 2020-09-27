const ACoconut = artifacts.require("ACoconut");
const ACoconutBTC = artifacts.require("ACoconutBTC");
const Controller = artifacts.require("Controller");
const AccountFactory = artifacts.require("AccountFactory");
const StakingApplication = artifacts.require("StakingApplication");

const deployStakingApplication = async (deployer, accounts) => {
    
    const aCoconut = (await ACoconut.deployed()).address;
    const aCoconutBTC = (await ACoconutBTC.deployed()).address;
    const controller = (await Controller.deployed()).address;
    const accountFactory = (await AccountFactory.deployed()).address;

    console.log("Deploying StakingApplication...");
    const stakingApplication = await deployer.deploy(StakingApplication, accountFactory, controller);

    console.log('ACoconut: ' + aCoconut);
    console.log('ACoconutBTC: ' + aCoconutBTC);
    console.log('Account factory: ' + accountFactory);
    console.log('Staking application: ' + stakingApplication.address);
}

module.exports = function (deployer, network, accounts) {
    deployer
        .then(() => deployStakingApplication(deployer, accounts))
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
};