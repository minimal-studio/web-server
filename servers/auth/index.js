let express = require('express');

let authApp = express.Router();

authApp.get('/', function (req, res) {
  res.send("Auth");
});

module.exports = authApp;