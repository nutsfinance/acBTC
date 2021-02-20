const argv = require('yargs').argv;
const Controller = artifacts.require("Controller");
const ACoconutBTC = artifacts.require("ACoconutBTC");
const ACoconutVault = artifacts.require("ACoconutVault");
const ACoconutSwap = artifacts.require("ACoconutSwap");
const ACoconutSwapProxy = artifacts.require("ACoconutSwapProxy");
const ACoconutMaker = artifacts.require("ACoconutMaker");
const CurveRenCrvMigrator = artifacts.require("CurveRenCrvMigrator");
const Timelock = artifacts.require("Timelock");
const SwapApplication = artifacts.require("SwapApplication");
const AdminUpgradeabilityProxy = artifacts.require("AdminUpgradeabilityProxy");
const { time } = require('@openzeppelin/test-helpers');
const ERC20 = artifacts.require("ERC20");
const MockWBTC = artifacts.require("MockWBTC");
const MockRenBTC = artifacts.require("MockRenBTC");

module.exports = async function (callback) {
    try {
        // const controller = (await Controller.deployed()).address;
        // console.log("Deploying ACoconutVault...");
        // await ACoconutVault.new(argv.name, argv.symbol, controller, argv.token, -1);

        // const aCoconutSwap = await ACoconutSwap.at('0xb16b25e5a1b65b99d3b160b524b2e31a4bb8e4a5');
        // const admin = '0xc25D6AD0C82F21bE056699d575284e18678F8fE5';
        // const deployer = '0x2932516D9564CB799DDA2c16559caD5b8357a0D6';

        // await ACoconutSwapProxy.new(aCoconutSwap.address, admin, {nonce: 237, gasPrice: '50000000000'});

        // await ACoconutBTC.new({gasPrice: '85000000000'});

        // await ACoconutMaker.new({gasPrice: '60000000000'});
        // await CurveRenCrvMigrator.new({gasPrice: '60000000000'});
        // await Timelock.new(admin, 24 * 3600, {gasPrice: '20000000000'});
        // console.log(web3.eth.abi.encodeParameters(['uint256', 'uint256'], ['1', '24000000000000000000000']));
        // console.log(web3.eth.abi.encodeParameters(['address', 'bool'], ['0x6660551884b1cCc968662d72c2e6897a1CA4BfAc', false]));
        // await SwapApplication.new({gasPrice: '40000000000'});

        // console.log(web3.eth.abi.encodeParameter('address', '0x64d8f840446aD5b06B8A0fFAfE2F9eed05adA8B0'));

        // const data = web3.eth.abi.encodeParameter('address', "0x64d8f840446aD5b06B8A0fFAfE2F9eed05adA8B0");
        // const txHash = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(['address','uint256','string','bytes','uint256'],
        //     ["0x1eB47C01cfAb26D2346B449975b7BF20a34e0d45", 0, 'setController(address)', data, 1608592191]));
        // console.log(txHash);

        // const aCoconutSwap = await ACoconutSwap.at('0x73FddFb941c11d16C827169Bb94aCC227841C396');
        // const admin = '0xc25D6AD0C82F21bE056699d575284e18678F8fE5';
        // const deployer = '0x2932516D9564CB799DDA2c16559caD5b8357a0D6';

        // await AdminUpgradeabilityProxy.new('0x02827D495B2bBe37e1C021eB91BCdCc92cD3b604', deployer, {gasPrice: '45000000000'});

        // const wbtc = await ERC20.at("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599");
        // const renbtc = await ERC20.at("0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D");
        // const acbtc = await ERC20.at("0xAcf806FeAeD6455244D34590AE57F772e80AA1a8");

        // console.log((await wbtc.balanceOf("0x1eB47C01cfAb26D2346B449975b7BF20a34e0d45")).toString());
        // console.log((await renbtc.balanceOf("0x1eB47C01cfAb26D2346B449975b7BF20a34e0d45")).toString());
        // console.log((await acbtc.balanceOf("0x1eB47C01cfAb26D2346B449975b7BF20a34e0d45")).toString());

        // await time.increaseTo(1603461600);

        // const timelock = await Timelock.at("0x7CC852Ed19ee9472489fCa82DE8df0fe331AAfCc");
        // await timelock.executeTransaction("0x1eB47C01cfAb26D2346B449975b7BF20a34e0d45", 0, "migrate()",
        //     "0x", 1603461600, {from: "0x2932516D9564CB799DDA2c16559caD5b8357a0D6"});

        // console.log((await wbtc.balanceOf("0x1eB47C01cfAb26D2346B449975b7BF20a34e0d45")).toString());
        // console.log((await renbtc.balanceOf("0x1eB47C01cfAb26D2346B449975b7BF20a34e0d45")).toString());
        // console.log((await acbtc.balanceOf("0x1eB47C01cfAb26D2346B449975b7BF20a34e0d45")).toString());

        // const wBTC = await MockWBTC.at("0xEEe534cb480bd0D0b44e2d1689592d65ad90EA3b");
        // const renBTC = await MockRenBTC.at("0x0A9ADD98C076448CBcFAcf5E457DA12ddbEF4A8f");
        // const acBTC = await ERC20.at("0xa89AFda1b03a3b436C8a3f4dEe7ef28ae3A37684");
        // const account = "0x2932516D9564CB799DDA2c16559caD5b8357a0D6";
        // await wBTC.mint(account, "2000000");
        // // await renBTC.mint(account, "100000000000000000000");
        // const acSwap = await ACoconutSwap.at("0x5AA676577F7A69F8761F5A19ae6057A386D6a48e");
        // await wBTC.approve(acSwap.address, "2000000");
        // await renBTC.approve(acSwap.address, "2000000");
        // console.log('Before', (await acBTC.balanceOf(account)).toString());
        // await acSwap.unpause();
        // await acSwap.mint(["2000000", "2000000"], 0);
        // console.log('After', (await acBTC.balanceOf(account)).toString());

        // const vault = await ACoconutVault.at("0xf2c6706af78d15549c9376d04e40957a3b357de4");
        // console.log(await vault.governance());
        
        const accounts = await web3.eth.getAccounts();
        web3.eth.sendTransaction({from: accounts[0], to: "0xc25D6AD0C82F21bE056699d575284e18678F8fE5", value: "10000000000000000000"})

        const timelock = await Timelock.at("0xeD4907815Ff134A50B50f73090f293f22F1FD51e");
        // const events = await timelock.getPastEvents('QueueTransaction', { fromBlock: 11352644});
        // console.log(events);
        const data = web3.eth.abi.encodeParameter('address', "0x64d8f840446aD5b06B8A0fFAfE2F9eed05adA8B0");
        await timelock.executeTransaction("0x1eB47C01cfAb26D2346B449975b7BF20a34e0d45", 0, "setController(address)",
            data, 1608592191, {from: "0xc25D6AD0C82F21bE056699d575284e18678F8fE5"});

        callback();
    } catch (e) {
        callback(e);
    }
}