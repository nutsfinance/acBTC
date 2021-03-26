const ACoconutBTC = artifacts.require("ACoconutBTC");
const ACoconutBTCProxy = artifacts.require("ACoconutBTCProxy");

const deployACoconutBTC = async (deployer, accounts) => {
  const acBTCImpl = await deployer.deploy(ACoconutBTC);
  const acBTCProxy = await deployer.deploy(ACoconutBTCProxy, acBTCImpl.address, accounts[1], Buffer.from(''));

  const acBTC = await ACoconutBTC.at(acBTCProxy.address);
  await acBTC.initialize();

  console.log(`acBTC: ${acBTC.address}`);
  console.log(`acBTC impl: ${acBTCImpl.address}`);
};

module.exports = function (deployer, network, accounts) {
  deployer
      .then(() => deployACoconutBTC(deployer, accounts))
      .catch(error => {
          console.log(error);
          process.exit(1);
      });
};
