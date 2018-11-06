const Router = require('koa-router');
const bodyParser = require('koa-body');

const testAuthData = require('./test-auth-data');

const authRouter = new Router();

// authRouter.use(bodyParser());

const auth = async (ctx, next) => {
  const { AdminName, Password } = ctx.request.body.data;
  const loginUser = testAuthData[AdminName];
  if(loginUser && Password === loginUser.password) {
    ctx.userInfo = {
      AdminName,
      SessId: 'suiyi'
    };
    await next();
  } else {
    ctx.body = {
      err: '未授权登录'
    };
  }
};

authRouter.post('/auth-login', bodyParser(), auth, async (ctx) => {
  const { userInfo } = ctx;
  ctx.body = {
    err: null,
    data: {
      userInfo
    }
  };
});

module.exports = authRouter;