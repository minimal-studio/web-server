let express = require('express');
let path = require('path');

let adminRouter = async (req, res) => {
  res.json({
    "user": 'Alex'
  });
}

module.exports = adminRouter;
