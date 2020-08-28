const argv = require('yargs').argv;
const MockToken = artifacts.require("MockToken");
const BasketManager = artifacts.require("BasketManager");
const BasketManagerProxy = artifacts.require("BasketManagerProxy");

module.exports = async function (callback) {
    try {
        const basketManagerProxy = await BasketManagerProxy.deployed();
        const basketManager = await BasketManager.at(basketManagerProxy.address);
        const mockToken = await MockToken.new(argv.name, argv.symbol);
        console.log("Token address: " + mockToken.address);
        await basketManager.addToken(mockToken.address);

        callback();
    } catch (e) {
        callback(e);
    }
}