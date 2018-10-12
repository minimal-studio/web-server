const logger = require('koa-morgan');
const fs = require('fs');
const path = require('path');
const Router = require('koa-router');

const app = require('./factories/app-server')();

// const dynamicRoute = require('../routers/dynamic-router');
const { mainServerPort, systemDir, publicStaticServerConfig } = require('./config');
const staticServer = require('./factories/static-server');
// const processUpdater = require('../routers/process-updater');
const handleError = require('./routers/error-handle');

const router = new Router();

const publicRouter = staticServer(publicStaticServerConfig);
const serversDir = 'servers';

const accessLogStream = fs.createWriteStream(path.join(process.cwd(), '/runtime/web-server.log'), {flags: 'a'});
app.use(logger('combined', {stream: accessLogStream}));

const pathInfos = fs.readdirSync(path.join(__dirname, serversDir));
const ignoreFirld = ['index.js', 'config', 'frond-end-deployment'];
pathInfos.filter(dirname => ignoreFirld.indexOf(dirname) === -1).forEach((dirname) => {
  const currServer = require('./' + path.join(serversDir, dirname));
  const serverPath = currServer.alias || dirname;
  const startSubServer = currServer.start;
  if(startSubServer) {
    try {
      startSubServer();
    } catch(e) {
      console.log(e);
    }
  } else if(currServer.routes) {
    app.use(currServer.routes());
  } else {
    router.all(`/${serverPath}`, currServer);
  }
});

app.use(publicRouter);

app.use(router.routes());

router.get('/', async ctx => {
  ctx.body = {};
});

app.listen(mainServerPort, async (err) => {
  if(err) return console.log(err);
  console.log(`main server started at port ` + mainServerPort);
});