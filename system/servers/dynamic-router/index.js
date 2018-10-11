const Router = require('koa-router');
const dynamicRoute = require('./dynamic-router');

const dyApp = new Router();

dyApp.use(dynamicRoute.routes());

module.exports = dyApp;