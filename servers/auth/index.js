const express = require('express');
const bodyParser = require('body-parser')
const testAuthData = require('./test-auth-data');

let authApp = express.Router();
const jsonParser = bodyParser.json();

const auth = (req, res, next) => {
  const { AdminName, Password } = req.body.data;
  if(testAuthData[AdminName] == Password) {
    req.userInfo = {
      AdminName,
      SessId: 'suiyi'
    }
    return next();
  } else {
    res.json({
      err: '未授权登录'
    })
  }
}

authApp.get('/auth-login', (req, res) => {
  res.json({
    err: null,
    data: {}
  });
});

authApp.post('/auth-login', [jsonParser, auth], (req, res) => {
  const { userInfo } = req;
  res.json({
    err: null,
    data: {
      userInfo
    }
  });
});

// 注册到根路由的标记
authApp.isForRootRouter = true

module.exports = authApp;