let ejs = require('ejs');
let path = require('path');

/**
 * 为了解决两种特定的业务需求
 * 
 * 1. 通过特定的 url 访问应用程序入口，
 *    例如上传的前端资源，有需要先获取远端业务服务器的数据，编译到模版中，
 *    模版存储路径为 ./assets/public/admin/html/index.ejs
 *    但是期望通过 host/dyr/app1 这个路由，完成上述情况的
 *    可以通过编写对应业务的动态路由，制定模版路径，然后完成以上操作
 * 
 * 2. 通过 public 共享资源直接访问入口的
 *    例如 host/public/admin/index.html
 *    但是需要获取额外数据的，可以在该 html 中编写请求，来获取特定的数据
 *    例如 ./assets/public/admin/index.html 中，请求 /dyr/get-admin-data 获取特定数据
 *    可以通过编写动态路由响应
 */
let tmplPath = path.join(process.cwd(), './assets/public/admin/html/index.ejs');
let ejsOptions = {};

let adminRouter = async (ctx) => {
  let html = await ejs.renderFile(tmplPath, {
    user: {
      name: 'alex'
    },
    site: {
      title: 'haha'
    }
  }, ejsOptions);
  ctx.body = html;
};

module.exports = adminRouter;
