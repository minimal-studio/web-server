const fs = require('fs');
const path = require('path');

const configFileName = path.join(__dirname, './config.js');

if(!fs.existsSync(configFileName)) {
  fs.writeFileSync(configFileName, `
const webhookConfig = {
  tgToken: 'none',
  port: 43343,
  chatIDs: {
    yourTg: 123,
    codeReview: -321,
    fedeployNotify: -213
  }
};

module.exports = webhookConfig;
  `)
}