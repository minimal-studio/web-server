let express = require('express');
let compression = require('compression');
let helmet = require('helmet');
let cors = require('cors')
let morgan = require('morgan');
let fs = require('fs');
let path = require('path');

// let dynamicRoute = require('../routers/dynamic-router');
let { mainServerPort, systemDir } = require('./config');
let publicRouter = require('./routers/public-assets');
// let processUpdater = require('../routers/process-updater');
let handleError = require('./routers/error-handle');

let app = express();

const serversDir = 'servers';

app.use(helmet());
app.use(compression());
app.use(cors());

let accessLogStream = fs.createWriteStream(path.join(process.cwd(), '/runtime/web-server.log'), {flags: 'a'});
app.use(morgan('combined', {stream: accessLogStream}));

let pathInfos = fs.readdirSync(path.join(__dirname, serversDir));
let ignoreFirld = ['index.js', 'config'];
pathInfos.filter(dirname => ignoreFirld.indexOf(dirname) === -1).forEach((dirname) => {
  let currServer = require('./' + path.join(serversDir, dirname));
  let serverPath = currServer.alias || dirname;
  let startSubServer = currServer.start;
  let isForRootRouter = currServer.isForRootRouter;
  if(startSubServer) {
    try {
      startSubServer();
    } catch(e) {
      console.log(e)
    }
  } else if(isForRootRouter) {
    app.use(currServer);
  } else {
    app.use(`/${serverPath}`, currServer);
  }
});

// app.use('/sub', webServerApp);
// app.get('/', function (req, res) {
//   res.send("This is the '/' route in main_app");
// });

// app.use(dynamicRoute);

app.use(publicRouter);

// app.use(processUpdater);

// 最后处理所有错误
app.use((req, res, next) => {
  res.status(404).send('non')
});

app.listen(mainServerPort, (err) => {
  if(err) return console.log(err);
  console.log(`main server started at port ` + mainServerPort);
});