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

module.exports = async function (callback) {
    try {
        // const controller = (await Controller.deployed()).address;
        // console.log("Deploying ACoconutVault...");
        // await ACoconutVault.new(argv.name, argv.symbol, controller, argv.token, -1);

        // const aCoconutSwap = await ACoconutSwap.at('0xb16b25e5a1b65b99d3b160b524b2e31a4bb8e4a5');
        // const admin = '0xc25D6AD0C82F21bE056699d575284e18678F8fE5';
        // const deployer = '0x2932516D9564CB799DDA2c16559caD5b8357a0D6';

        // await ACoconutSwapProxy.new(aCoconutSwap.address, admin, {nonce: 237, gasPrice: '50000000000'});

        await ACoconutBTC.new({gasPrice: '85000000000'});

        // await ACoconutMaker.new({gasPrice: '60000000000'});
        // await CurveRenCrvMigrator.new({gasPrice: '60000000000'});
        // await Timelock.new(deployer, 24 * 3600, {gasPrice: '45000000000'});
        // await SwapApplication.new({gasPrice: '40000000000'});

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

        callback();
    } catch (e) {
        callback(e);
    }
}