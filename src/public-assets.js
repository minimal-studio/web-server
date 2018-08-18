let express = require('express');
let path = require('path');
let publicRouter = express.Router();

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

publicRouter.use('/public', express.static(path.join(__dirname, '../assets/public'), options))

module.exports = publicRouter;