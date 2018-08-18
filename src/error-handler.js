let notFount = require('./notfound');

let handleError = (err, req, res, next) => {
  if(err) {
    notFount(req, res);
  }
  next();
}

module.exports = handleError;