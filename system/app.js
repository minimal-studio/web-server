// const koa = require('koa');
// const compress = require('koa-compress');
// const helmet = require('koa-helmet');
// const cors = require('@koa/cors');
const logger = require('koa-morgan');
const fs = require('fs');
const path = require('path');
const Router = require('koa-router');

const app = require('./app-factory')();

// const dynamicRoute = require('../routers/dynamic-router');
const { mainServerPort, systemDir } = require('./config');
const publicRouter = require('./routers/public-assets');
// const processUpdater = require('../routers/process-updater');
const handleError = require('./routers/error-handle');

const router = new Router();

const serversDir = 'servers';

// app.use(helmet());
// app.use(compress());
// app.use(cors());

let accessLogStream = fs.createWriteStream(path.join(process.cwd(), '/runtime/web-server.log'), {flags: 'a'});
app.use(logger('combined', {stream: accessLogStream}));

let pathInfos = fs.readdirSync(path.join(__dirname, serversDir));
let ignoreFirld = ['index.js', 'config'];
pathInfos.filter(dirname => ignoreFirld.indexOf(dirname) === -1).forEach((dirname) => {
  let currServer = require('./' + path.join(serversDir, dirname));
  let serverPath = currServer.alias || dirname;
  let startSubServer = currServer.start;
  let toRoot = currServer.toRoot;
  if(startSubServer) {
    try {
      startSubServer();
    } catch(e) {
      console.log(e);
    }
  } else if(toRoot) {
    app.use(currServer);
  } else {
    router.all(`/${serverPath}`, currServer);
  }
});

// app.use('/sub', webServerApp);
// app.get('/', function (req, res) {
//   res.send("This is the '/' route in main_app");
// });

// app.use(dynamicRoute);

app.use(publicRouter);

app.use(router.routes());

// app.use(processUpdater);

// 最后处理所有错误
app.use((req, res, next) => {
  res.status(404).send('non');
});

app.listen(mainServerPort, async (err) => {
  if(err) return console.log(err);
  console.log(`main server started at port ` + mainServerPort);
});