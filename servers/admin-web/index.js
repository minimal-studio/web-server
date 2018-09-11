let express = require('express');
let compression = require('compression');
let helmet = require('helmet');
let cors = require('cors')
let path = require('path');

let { adminServerPort } = require('../../config');

const startServer = () => {
  let app = express();
  app.use(helmet());
  app.use(compression());
  app.use(cors());

  let options = {
    dotfiles: 'ignore',
    etag: false,
    index: 'index.html',
    maxAge: '1d',
    redirect: true,
    setHeaders: function (res, path, stat) {
      res.set('x-timestamp', Date.now())
    }
  }

  app.use('/admin', express.static(path.join(process.cwd(), './assets/_admin/build/'), options));

  app.use((req, res) => {
    res.status(404).send('none');
  })
  
  app.listen(adminServerPort, () => {
    console.log('Admin server started, at port: ' + adminServerPort)
  });
}

module.exports.start = startServer;

// let express = require('express');
// let path = require('path');

// let dyApp = express.Router();


// module.exports = dyApp;