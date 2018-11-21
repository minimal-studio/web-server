const Telegraf = require('telegraf');
const Router = require('koa-router');
const bodyParser = require('koa-body');

const app = require('../../factories/app-server')();

/** 在引用 config 之前使用引用 check config，用于检查并生成 config 文件 */
require('./check-config');
const webhookConfig = require('./config');
const dateFormat = require('dateformat');

const webhookRouter = new Router();
const { tgToken, port, chatIDs } = webhookConfig;

const hasTgToken = tgToken && tgToken !== 'none';

if(!hasTgToken) {
  console.log('请填写 tgToken，否则无法进行 telegram bot 匹配.');
}

const bot = new Telegraf(tgToken);

const gitMsgFilter = ({
  username, type, desc, subtype, url, projectName
}) => {
  return `
<code>项目: ${projectName}</code>
<code>操作者: ${username}</code>
<code>类型: ${type}${subtype ? ' - ' + subtype : ''}</code>
<code>内容: ${desc}</code>
<a href="${url}">地址: ${url}</a>`;
};

const handleTestBot = (ctx) => {
  bot.telegram.sendMessage(chatIDs.alex, 'working');
  ctx.body = {
    err: null,
  };
};

const handleGitWebHook = (ctx) => {
  const { object_kind, user_name, project, commits = {}, object_attributes = {} } = ctx.request.body;
  const { homepage } = project;
  const isMergeRequest = object_kind === 'merge_request';
  const currCommit = isMergeRequest ? object_attributes.last_commit : commits[0];

  bot.telegram.sendMessage(chatIDs.codeReview, gitMsgFilter({
    username: currCommit ? currCommit.author.name : user_name,
    type: object_kind,
    url: currCommit ? currCommit.url : homepage,
    projectName: project.name,
    desc: currCommit ? currCommit.message : ''
  }), {
    parse_mode: 'HTML'
  }).then(() => {
    ctx.body = {
      err: null,
    };
  }).catch((e) => {
    console.log(e);
    ctx.body = {
      err: e,
    };
  });
};

const scpMsgFilter = ({ project, desc, date, operator, host = '' }) => {
  date = dateFormat(date, 'yyyy-mm-dd hh:MM:ss');
  console.log(host)
  return `
<code>项目: ${project}</code>
<code>操作者: ${operator}</code>
<code>时间: ${date}</code>
<code>内容: ${desc}</code>
<a href="${host}">地址: ${host}</a>`;
};

const handleScpNotify = (ctx) => {
  bot.telegram.sendMessage(chatIDs.fedeployNotify, scpMsgFilter(ctx.request.body), {
    parse_mode: 'HTML'
  });
  ctx.body = {};
};

webhookRouter.get('/__test__', handleTestBot);
webhookRouter.get('/scp', (ctx) => ctx.body = 'got scp router!');

webhookRouter.post('/git', handleGitWebHook);
webhookRouter.post('/scp', handleScpNotify);

if(hasTgToken) {
  bot.startPolling();
}

module.exports.start = () => {
  app.use(bodyParser());
  app.use(webhookRouter.routes());

  app.listen(port, async () => {
    console.log('Webhook server started, at port: ' + port);
  });
};