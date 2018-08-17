let express = require('express');
let bodyParser = require('body-parser');
let router = express.Router();
let path = require('path');
let notFound = require('./notfound');

let rootRoute = (req, res) => {
  res.send('root');
}

let dynamicRoute = (req, res) => {
  let dynamicRoutersPath = path.join(process.cwd(), './dynamic-routres', req.params.route);
  try {
    let currRouter = require(dynamicRoutersPath);
    currRouter(req, res);
  } catch(e) {
    notFound(req, res);
  }
}

router.get('/', rootRoute);
router.get('/:route', dynamicRoute);

module.exports = router;
