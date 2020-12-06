const HarmoGame = artifacts.require("HarmoGame");
const refAddress ="0xF55e732Ef55AB5336bc9d9416b022358b8F19D50"
const fs = require('fs');

module.exports = function(deployer) {
  deployer.then(function() {
    return deployer.deploy(HarmoGame, refAddress).then(function() {
    let deployData = {
      'contract_address': HarmoGame.address,
    }
    let deployDir = __dirname + "/../deploy/contracts/"
    if (!fs.existsSync(deployDir)){
      fs.mkdirSync(deployDir, {recursive: true})
    }
    fs.writeFileSync(deployDir + "HarmoGame.json", JSON.stringify(deployData))
    })

  })
};