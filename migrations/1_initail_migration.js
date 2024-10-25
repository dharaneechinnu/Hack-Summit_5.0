const Hospital = artifacts.require('Hospital');

module.exports = async function (deployer, network, accounts) {
    console.log(accounts); // Logs all available accounts for reference
    await deployer.deploy(Hospital); // No need to pass an admin address, as it will be set automatically to msg.sender
};
