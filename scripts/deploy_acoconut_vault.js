const argv = require('yargs').argv;
const Controller = artifacts.require("Controller");
const ACoconutVault = artifacts.require("ACoconutVault");

module.exports = async function (callback) {
    try {
        const controller = (await Controller.deployed()).address;
        console.log("Deploying ACoconutVault...");
        await ACoconutVault.new(argv.name, argv.symbol, controller, argv.token, -1);

        callback();
    } catch (e) {
        callback(e);
    }
}