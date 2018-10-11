let notFount = require('../notfound');

let handleError = (err, req, res, next) => {
  console.log(err);
  if(err) {
    return notFount(req, res);
  } else {
    return res.status(404).send("Sorry can't find that!");
  }
};

module.exports = handleError;