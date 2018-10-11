const notFound = async (ctx) => {
  ctx.body = {
    err: ctx.error,
    desc: '404'
  };
};

module.exports = notFound;