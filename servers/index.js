let express = require('express');
let compression = require('compression');
let helmet = require('helmet');
let morgan = require('morgan');
let fs = require('fs');
let path = require('path');

// let dynamicRoute = require('../routers/dynamic-router');
let publicRouter = require('../routers/public-assets');
// let processUpdater = require('../routers/process-updater');
let handleError = require('../error-handle');

let app = express();

app.use(helmet());
app.use(compression());

let accessLogStream = fs.createWriteStream(path.join(process.cwd(), '/web-server.log'), {flags: 'a'});
app.use(morgan('combined', {stream: accessLogStream}));

let pathInfos = fs.readdirSync(path.join(process.cwd(), './servers'));
let ignoreFirld = 'index';
pathInfos.filter(dirname => dirname.indexOf(ignoreFirld) == -1).forEach((dirname) => {
  // console.log(dirname)
  let currServer = require('./' + dirname);
  let serverPath = currServer.alias || dirname;
  app.use(`/${serverPath}`, currServer);
});


// app.use('/sub', webServerApp);
// app.get('/', function (req, res) {
//   res.send("This is the '/' route in main_app");
// });

// app.use(dynamicRoute);

app.use(publicRouter);

// app.use(processUpdater);

// // 最后处理所有错误
// // app.use(handleError);

app.listen(3000);