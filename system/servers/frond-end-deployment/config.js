const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fse = require('fs-extra');
const fs = require('fs');
const os  = require('os');

const cwd = process.cwd();
const dbPath = path.join(cwd, './runtime/f-e-deployment-store');
const dbStorePath = path.join(dbPath, './store.json');
const auditdbStorePath = path.join(dbPath, './audit-store.json');
const staticServerPath = path.join(cwd, './assets/public');
const zipAssetsStorePath = path.join(cwd, './assets/zips');

if(!fs.existsSync(dbStorePath)) {
  fse.mkdirpSync(zipAssetsStorePath);
  fse.mkdirpSync(dbPath);
  fse.writeJsonSync(dbStorePath, {});
  fse.writeJsonSync(auditdbStorePath, {});
}

// 最大的资源存放数量，默认 30 个
const maxAssetCount = 30;

const adapter = new FileSync(dbStorePath);
const db = low(adapter);

const auditAdapter = new FileSync(auditdbStorePath);
const auditdb = low(auditAdapter);
const sshPath = path.join(os.homedir(), ".ssh/config");

/**
 * TODO: 默认初始化两个模块
 * 1. 管理此 web server 的模版
 * 2. 管理默认管理中心的模版
 */
db.defaults({
  version: 1,
  projects: {},
  assets: {},
}).write();

auditdb.defaults({}).write();

module.exports = {
  dbStorePath,
  staticServerPath,
  zipAssetsStorePath,
  maxAssetCount,
  sshPath,
  db,
  adapter,
  getDeployPath: (projCode) => {
    if(!projCode) return console.log('need to pass projCode');
    return path.join(staticServerPath, projCode);
  },
  getAssetsPath: (projCode) => {
    let assetDir = path.join(staticServerPath, projCode);
    // let deployStorePath = path.join(assetDir, './deploy');
    let deployStorePath = assetDir;

    return {
      deployStorePath, assetDir, 
    }
  },
  audit: (projId, note) => {
    let operator = note.operator || note.username || '';
    if(!operator) return 'need pass username.';
    let nextState = Object.assign({}, note, {
      date: Date.now(),
      operator: operator
    });
    delete nextState['username'];
    if(!auditdb.get(`${projId}`).value()) {
      auditdb.set(`${projId}`, []).write();
    }
    console.log(nextState)
    auditdb.get(`${projId}`).push(nextState).write();
  },
  getAudit: (projId) => {
    return [...auditdb.get(`${projId}`).value()].reverse();
  }
}