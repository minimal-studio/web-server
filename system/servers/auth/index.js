const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const testAuthData = require('./test-auth-data');

const authRouter = new Router();

// authRouter.use(bodyParser());

const auth = async (ctx, next) => {
  const { res } = ctx;
  const { AdminName, Password } = ctx.body.data;
  if(testAuthData[AdminName].password == Password) {
    ctx.userInfo = {
      AdminName,
      SessId: 'suiyi'
    };
    await next();
  } else {
    res.json({
      err: '未授权登录'
    });
  }
};

authRouter.post('/auth-login', bodyParser, auth, async (ctx) => {
  const { userInfo } = ctx;
  ctx.res.json({
    err: null,
    data: {
      userInfo
    }
  });
});

module.exports = authRouter;