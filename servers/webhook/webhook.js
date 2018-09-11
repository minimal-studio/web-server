const express = require('express');
const bodyParser = require('body-parser');

let webhookRouter = express.Router();

const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });

const resFilter = (req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
}

webhookRouter.use(resFilter);

module.exports = webhookRouter;