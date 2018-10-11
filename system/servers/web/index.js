
module.exports = async (ctx, next) => {
  await next();
  ctx.body = "This is the '/' route in sub_app";
};