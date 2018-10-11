const testRouter = async (ctx) => {
  setTimeout(() => {
    ctx.body = {
      err: null,
      data: {}
    };
  }, 1000);
}

module.exports = testRouter;
