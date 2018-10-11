const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const path = require('path');
const fs = require('fs');

const notFound = require('../../routers/notfound');
const { dyrPath } = require('../../config');

const dynamicRouter = new Router();

const rootRoute = async (ctx) => {
  ctx.body = 'root';
};

const getDynamicRouterModule = (route) => {
  return path.join(dyrPath, route);
};

const dynamicRoute = async (ctx) => {
  const { params } = ctx;
  const dynamicRoutersPath = getDynamicRouterModule(params.route);
  try {
    const currRouter = require(dynamicRoutersPath);
    // if(currRouter.subRouter) dynamicRouter.use(currRouter.subRouter);
    return await currRouter(ctx);
  } catch(e) {
    ctx.error = e;
    return await notFound(ctx);
  }
};

const reloadModule = async (ctx) => {
  const moduleName = ctx.params.moduleName;
  if(!moduleName) return ctx.body = 'no module-name';
  const dynamicRoutersPath = getDynamicRouterModule(moduleName);

  const moduleId = require.resolve(dynamicRoutersPath);

  try {
    delete require.cache[moduleId];
    ctx.body = 'ok';
  } catch(e) {
    console.log(e);
    ctx.body = e + '';
  }
};

const listDyrs = async (ctx) => {
  try {
    let pathInfos = fs.readdirSync(dyrPath);
    ctx.body = {
      err: null,
      data: pathInfos
    };
  } catch(e) {
    console.log(e + '');
    ctx.body = {
      err: e + ''
    };
  }
};

dynamicRouter.get('/__reload_module/:moduleName', reloadModule);
dynamicRouter.get('/__list', listDyrs);
dynamicRouter.all('/:route', dynamicRoute);
dynamicRouter.get('/', rootRoute);

module.exports = dynamicRouter;
