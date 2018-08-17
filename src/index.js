let express = require('express');
let helmet = require('helmet');
let dynamicRoute = require('./dynamic-router');
let notFound = require('./notfound');

let app = express();

app.use(helmet());
try {
  app.use(dynamicRoute);
} catch(e) {
  app.use(notFound);
}

app.listen(3000);