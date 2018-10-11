let express = require('express');
let path = require('path');
let fs = require('fs');

let { publicStaticPaths } = require('../config');

let publicRouter = express.Router();

fs.mkdir(path.join(process.cwd(), 'assets/public'), (err) => {
  // console.log(err)
});

let options = {
  dotfiles: 'ignore',
  etag: false,
  index: 'index.html',
  maxAge: '1d',
  redirect: true,
  setHeaders: function (res, path, stat) {
    res.set('x-timestamp', Date.now());
  }
};

publicStaticPaths.forEach((_p) => {
  publicRouter.use('/' + _p, express.static(path.join(process.cwd(), './assets/public'), options));
});

module.exports = publicRouter;