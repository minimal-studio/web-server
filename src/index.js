let express = require('express');
let helmet = require('helmet');
let dynamicRoute = require('./dynamic-router');
let handleError = require('./error-handler');
let publicRouter = require('./public-assets');
let processUpdater = require('./process-updater');

let app = express();

app.use(helmet());

app.use(dynamicRoute);

app.use(publicRouter);

app.use(processUpdater);

// 最后处理所有错误
// app.use(handleError);

app.listen(3000);