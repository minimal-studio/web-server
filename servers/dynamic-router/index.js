let express = require('express');
let dynamicRoute = require('../../routers/dynamic-router');

let dyApp = express.Router();

dyApp.use(dynamicRoute);

// 外层的路由的别名
dyApp.alias = 'dyr';

module.exports = dyApp;