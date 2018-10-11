const bodyParser = require('koa-bodyParser');
const Router = require('koa-router');

const webhookRouter = new Router();

const resFilter = async (ctx, next) => {
  ctx.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  ctx.header('Expires', '-1');
  ctx.header('Pragma', 'no-cache');
  await next();
};

webhookRouter.use('/', resFilter);

module.exports = webhookRouter;