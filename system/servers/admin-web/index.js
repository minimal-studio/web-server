const staticServer = require('koa-static');
const mount = require('koa-mount');

const app = require('../../factories/app-server')();

const { adminServerPort, adminDirName } = require('../../config');

const startServer = () => {
  app.use(mount('/admin', staticServer(`./assets/${adminDirName}/build/`)));
  app.use(mount('/', staticServer(`./assets/${adminDirName}/build/`)));

  // app.use(async (ctx) => {
  //   ctx.responese.status = 404;
  //   ctx.body = 'none';
  // });
  
  app.listen(adminServerPort, async () => {
    console.log('Admin server started, at port: ' + adminServerPort);
  });
};

module.exports.start = startServer;