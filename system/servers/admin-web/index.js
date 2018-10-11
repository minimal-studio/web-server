const staticServer = require('koa-static');
const mount = require('koa-mount');

const app = require('./app-factory')();

const { adminServerPort, adminDirName } = require('../../config');

const startServer = () => {
  app.use(mount('/admin', staticServer(`./assets/${adminDirName}/build/`)));

  app.use((cxt) => {
    cxt.res.status(404).send('none');
  });
  
  app.listen(adminServerPort, async () => {
    console.log('Admin server started, at port: ' + adminServerPort);
  });
};

module.exports.start = startServer;