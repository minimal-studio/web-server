const app = require('../../factories/app-server')();

let { FEServerPort } = require('../../config');

let deployment = require('./deployment');

const startServer = () => {
  
  app.use(deployment.routes());

  app.listen(FEServerPort, async () => {
    console.log('FEDeployment server started, at port: ' + FEServerPort);
  });
};
module.exports.start = startServer;
