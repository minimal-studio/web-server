// const express = require('express');
// const ejs = require('ejs');
// const cors = require('cors');

// const checkip = require('../checkip');
// const gameRouter = require('../routers/game.react.router');
// const getReourceRouter = require('../routers/static.source');
// const compression = require('compression');
// const appVersion = require('../app.check.version.js');

// var gameServer = express();

// gameServer.disable('x-powered-by');

// gameServer.set('view engine', 'ejs');
// gameServer.use(compression());

// export default function addReactRouter(platform, config) {
//   gameServer.use('/'+platform, cors(config.corsOptions));
//   gameServer.use('/'+platform, checkip(platform, config));
//   gameServer.use('/'+platform, gameRouter(platform, config));
//   gameServer.use('/'+platform, getReourceRouter('react_router', platform));
//   return gameServer
// }
let express = require('express');

let app = express.Router();

app.get('/', function (req, res) {
  res.send("This is the '/' route in sub_app");
});

module.exports = app;