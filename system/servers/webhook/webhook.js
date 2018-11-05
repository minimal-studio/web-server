const Router = require('koa-router');

const webhookRouter = new Router();

const resFilter = async (ctx, next) => {
  ctx.set({
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'Expires': '-1',
    'Pragma': 'no-cache'
  });
  await next();
};

webhookRouter.use(resFilter);
webhookRouter.get('/', (ctx) => {
  ctx.body = 'Welcome to webhook';
});
webhookRouter.post('/git-notify', (ctx) => {
  ctx.body = 'Welcome to git-notify';
});
webhookRouter.get('/git-notify', (ctx) => {
  ctx.body = 'Welcome to git-notify';
});

module.exports = webhookRouter;