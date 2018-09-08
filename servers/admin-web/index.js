let express = require('express');
let compression = require('compression');
let helmet = require('helmet');
let cors = require('cors')
let config = require('./config');
let path = require('path');

const startServer = () => {
  let app = express();
  app.use(helmet());
  app.use(compression());
  app.use(cors());

  let options = {
    dotfiles: 'ignore',
    etag: false,
    index: false,
    maxAge: '1d',
    redirect: false,
    setHeaders: function (res, path, stat) {
      res.set('x-timestamp', Date.now())
    }
  }

  app.use('/admin', express.static(path.join(process.cwd(), './assets/_admin/build/'), options));
  
  app.listen(config.port, () => {
    console.log('FEDeployment server started, at port: ' + config.port)
  });
}

module.exports.start = startServer;

// let express = require('express');
// let path = require('path');

// let dyApp = express.Router();


// module.exports = dyApp;