const appFactory = () => {
  const koa = require('koa');
  const compress = require('koa-compress');
  const helmet = require('koa-helmet');
  const cors = require('@koa/cors');
  
  const app = koa();
  
  app.use(helmet());
  app.use(compress());
  app.use(cors());

  return app;
};

module.exports = appFactory;
