const ACoconut = artifacts.require("ACoconut");
const ACoconutBTC = artifacts.require("ACoconutBTC");
const ACoconutVault = artifacts.require("ACoconutVault");
const AccountFactory = artifacts.require("AccountFactory");
const StakingApplication = artifacts.require("StakingApplication");

const addACoconutVault = async (deployer, accounts) => {
    
    const aCoconut = (await ACoconut.deployed()).address;
    const aCoconutBTC = (await ACoconutBTC.deployed()).address;
    const aCoconutVault = (await ACoconutVault.deployed()).address;
    const accountFactory = (await AccountFactory.deployed()).address;
    const stakingApplication = await StakingApplication.deployed();

    await stakingApplication.addVault(aCoconutVault);

    console.log('ACoconut: ' + aCoconut);
    console.log('ACoconutBTC: ' + aCoconutBTC);
    console.log('Account factory: ' + accountFactory);
    console.log('Staking application: ' + stakingApplication.address);
}

module.exports = function (deployer, network, accounts) {
    deployer
        .then(() => addACoconutVault(deployer, accounts))
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
};