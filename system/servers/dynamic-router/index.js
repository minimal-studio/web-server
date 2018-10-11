const Router = require('koa-router');
const dynamicRoute = require('./dynamic-router');

const dyApp = new Router({
  prefix: '/dyr'
});

dyApp.use(dynamicRoute.routes());

module.exports = dyApp;