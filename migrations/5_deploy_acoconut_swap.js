const ACoconutSwap = artifacts.require("ACoconutSwap");
const ACoconutSwapProxy = artifacts.require("ACoconutSwapProxy");

const deployACoconutSwap = async (deployer, accounts) => {
  const acSwapImpl = await deployer.deploy(ACoconutSwap);
  const acSwapProxy = await deployer.deploy(ACoconutSwapProxy, acSwapImpl.address, accounts[1], Buffer.from(''));

  console.log(`ACoconutSwap: ${acSwapProxy.address}`);
  console.log(`ACoconutSwap impl: ${acSwapImpl.address}`);
};

module.exports = function (deployer, network, accounts) {
  deployer
      .then(() => deployACoconutSwap(deployer, accounts))
      .catch(error => {
          console.log(error);
          process.exit(1);
      });
};
