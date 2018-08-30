let express = require('express');
let compression = require('compression');
let helmet = require('helmet');
let cors = require('cors')
let config = require('./config');

let deployment = require('./deployment');

const startServer = () => {
  let app = express();
  app.use(helmet());
  app.use(compression());
  app.use(cors());
  
  app.use(deployment);

  app.listen(config.port, () => {
    console.log('FEDeployment server started, at port: ' + config.port)
  });
}
module.exports.start = startServer;
