const app = require('../../factories/app-server')();

let { webhookPort } = require('../../config');
let webhook = require('./webhook');

const startServer = () => {
  app.use(webhook.routes());

  app.listen(webhookPort, async () => {
    console.log('webhook server started, at port: ' + webhookPort);
  });
};
module.exports.start = startServer;
