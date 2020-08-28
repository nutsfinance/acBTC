const argv = require('yargs').argv;
const MockToken = artifacts.require("MockToken");

module.exports = async function (callback) {
    try {
        const mockToken = await MockToken.at(argv.address);
        await mockToken.mint(argv.target, argv.amount);

        callback();
    } catch (e) {
        callback(e);
    }
}