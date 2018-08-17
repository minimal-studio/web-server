import addManager from './servers/manager';
import addReactRouter from './servers/game.react.router';
import addReactWithoutRouter from './servers/game.withoutrouter';
import addStatic from './servers/static';
import config from '../config';
import portConfig from '../portConfig';

let managerServer = addManager(config);

function notfound(req, res, next) {
  res.status(404).send('<div style="padding-top: 2em;text-align: center;font-size: 2.5em">404 <a href="/">返回首页</a><div>');
}

let staticServer = null;
let gameServer = null;
let gameServer2 = null;

Object.keys(config).forEach(platform => {
  let conf = config[platform];
  staticServer = addStatic(platform, conf);
  gameServer = addReactRouter(platform, conf);
  gameServer2 = addReactWithoutRouter(platform, conf);
})

managerServer.use('*', notfound)
gameServer.use('*', notfound)
gameServer2.use('*', notfound)
staticServer.use('*', notfound)

gameServer.listen(portConfig.gameRouterPort, () => {
  console.log('Matrix Web Server mobile started, Listening at port: %s', portConfig.gameRouterPort);
});
