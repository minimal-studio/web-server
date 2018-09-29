const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const notFound = require('../../routers/notfound');
const { dyrPath } = require('../../config');

const dynamicRouter = express.Router();

const rootRoute = (req, res) => {
  res.send('root');
}

const getDynamicRouterModule = (route) => {
  return path.join(dyrPath, route);
}

const dynamicRoute = (req, res) => {
  const dynamicRoutersPath = getDynamicRouterModule(req.params.route);
  try {
    const currRouter = require(dynamicRoutersPath);
    // if(currRouter.subRouter) dynamicRouter.use(currRouter.subRouter);
    currRouter(req, res);
  } catch(e) {
    notFound(req, res);
  }
}

const reloadModule = (req, res) => {
  const moduleName = req.params.moduleName;
  if(!moduleName) return res.send('no module-name');
  const dynamicRoutersPath = getDynamicRouterModule(moduleName);

  const moduleId = require.resolve(dynamicRoutersPath);

  try {
    delete require.cache[moduleId];
    res.send('ok');
  } catch(e) {
    console.log(e);
    res.send(e + '');
  }
}

const listDyrs = (req, res) => {
  try {
    let pathInfos = fs.readdirSync(dyrPath);
    res.json({
      err: null,
      data: pathInfos
    });
  } catch(e) {
    console.log(e + '');
    res.json({
      err: e + ''
    });
  }
}

const createRoute = () => {
  
}

dynamicRouter.use('/__reload_module/:moduleName', reloadModule);
dynamicRouter.use('/__list', listDyrs);
dynamicRouter.use('/:route', dynamicRoute);
dynamicRouter.use('/', rootRoute);

module.exports = dynamicRouter;
