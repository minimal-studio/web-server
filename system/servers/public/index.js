const staticServer = require('koa-static');
const mount = require('koa-mount');
const { publicStaticServerConfig } = require('../../config');

const agentFunc = () => {
  return mount(publicStaticServerConfig.route, staticServer(publicStaticServerConfig.assetPath));
};
agentFunc.isAgent = true;

module.exports = agentFunc;