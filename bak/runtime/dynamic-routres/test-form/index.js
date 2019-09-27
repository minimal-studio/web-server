let testRouter = (req, res) => {
  setTimeout(() => {
    res.json({
      err: null,
      data: {}
    });
  }, 1000);
}

module.exports = testRouter;
