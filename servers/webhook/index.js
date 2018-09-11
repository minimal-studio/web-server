let express = require('express');
let compression = require('compression');
let helmet = require('helmet');
let cors = require('cors')

let { webhookPort } = require('../../config');

let webhook = require('./webhook');

const startServer = () => {
  let app = express();
  app.use(helmet());
  app.use(compression());
  app.use(cors());
  
  app.use(webhook);

  app.listen(webhookPort, () => {
    console.log('webhook server started, at port: ' + webhookPort)
  });
}
module.exports.start = startServer;
