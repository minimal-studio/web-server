let express = require('express');

let authApp = express.Router();

authApp.get('/', function (req, res) {
  res.send("Auth");
});

authApp.post('/auth', function (req, res) {
  console.log(req)
  
  res.send("Auth");
});

module.exports = authApp;