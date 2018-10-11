const testData = require('./test-data');

const testRouter = async (ctx) => {
  ctx.body = {
    err: null,
    data: testData
  };
}

module.exports = testRouter;
