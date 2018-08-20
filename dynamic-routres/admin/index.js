let express = require('express');
let ejs = require('ejs');
let path = require('path');

let tmplPath = path.join(process.cwd(), './assets/public/admin/html/index.ejs');

let adminRouter = async (req, res) => {
  let html = await ejs.renderFile(tmplPath, {
    user: {
      name: 'alex'
    }
  }, {});
  res.send(html);
}

module.exports = adminRouter;
