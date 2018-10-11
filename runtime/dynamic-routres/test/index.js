const testData = require('./test-data');

const testRouter = async (req, res) => {
  res.json({
    err: null,
    data: testData
  });
}

module.exports = testRouter;
