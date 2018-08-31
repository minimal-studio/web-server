let express = require('express');
let ejs = require('ejs');
let path = require('path');

let testData = require('./test-data');

let testRouter = async (req, res) => {
  res.json({
    Header: {
      Code: 0,
      Desc: '成功'
    },
    Data: testData
  });
}

module.exports = testRouter;
