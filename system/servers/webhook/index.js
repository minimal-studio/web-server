const Telegraf = require('telegraf');
const Router = require('koa-router');
const bodyParser = require('koa-body');

const app = require('../../factories/app-server')();
const webhookConfig = require('./config');

const webhookRouter = new Router();
const { tgToken, port, chatIDs } = webhookConfig;
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

const scpMsgFilter = ({ project, desc, date, operator, url = '' }) => {
  return `
<code>项目: ${project}</code>
<code>操作者: ${operator}</code>
<code>时间: ${date}</code>
<code>内容: ${desc}</code>
<a href="${url}">地址: ${url}</a>`;
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

bot.startPolling();

module.exports.start = () => {
  app.use(bodyParser());
  app.use(webhookRouter.routes());

  app.listen(port, async () => {
    console.log('Webhook server started, at port: ' + port);
  });
};