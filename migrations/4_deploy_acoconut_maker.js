const ACoconutMaker = artifacts.require("ACoconutMaker");
const ACoconutMakerProxy = artifacts.require("ACoconutMakerProxy");
const ACoconutBTCProxy = artifacts.require("ACoconutBTCProxy");

const deployACoconutMaker = async (deployer, accounts) => {
  const acMakerImpl = await deployer.deploy(ACoconutMaker);
  const acMakerProxy = await deployer.deploy(ACoconutMakerProxy, acMakerImpl.address, accounts[1], Buffer.from(''));

  const acBTC = await ACoconutBTCProxy.deployed();
  const acMaker = await ACoconutMaker.at(acMakerProxy.address);
  await acMaker.initialize(acBTC.address);

  console.log(`acMaker: ${acMaker.address}`);
  console.log(`acMaker impl: ${acMakerImpl.address}`);
};

module.exports = function (deployer, network, accounts) {
  deployer
      .then(() => deployACoconutMaker(deployer, accounts))
      .catch(error => {
          console.log(error);
          process.exit(1);
      });
};
