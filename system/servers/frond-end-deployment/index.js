const app = require('../../factories/app-server')();
const { FEServerPort } = require('../../config');
const { deploymentRouter, assetUploadRouter } = require('./deployment');

const startServer = () => {
  
  app.use(deploymentRouter.routes());
  app.use(assetUploadRouter.routes());

  app.listen(FEServerPort, async () => {
    console.log('FEDeployment server started, at port: ' + FEServerPort);
  });
};
module.exports.start = startServer;
