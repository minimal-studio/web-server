const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fse = require('fs-extra');
const fs = require('fs');
const os  = require('os');
const request  = require('request');

const { adminDirName } = require('../../config');

const cwd = process.cwd();
const dbPath = path.join(cwd, './runtime/f-e-deployment-store');
const dbStorePath = path.join(dbPath, './store.json');
const auditdbStorePath = path.join(dbPath, './audit-store.json');
const deployConfigStorePath = path.join(dbPath, './deployment-store.json');
const staticServerPath = path.join(cwd, './assets/public');
const adminResourcePath = path.join(cwd, './assets', adminDirName);
const zipAssetsStorePath = path.join(cwd, './assets/zips');

const remoteZipStorePath = '~/.front-end-zip';

const superList = ['admin'];
const superPowerChecker = (username) => {
  return superList.includes(username);
};

if(!fs.existsSync(deployConfigStorePath)) {
  let dbStore = {}, auditdbStore = {}, deployConfigStore = {};
  /** 使用上一份的数据，保证不会数据丢失 */
  try {
    dbStore = require(dbStorePath);
    auditdbStore = require(auditdbStorePath);
    deployConfigStore = require(deployConfigStorePath);
  } catch(e) {
    console.log(e);
  }
  fse.mkdirpSync(zipAssetsStorePath);
  fse.mkdirpSync(adminResourcePath);
  fse.mkdirpSync(dbPath);
  fse.writeJsonSync(dbStorePath, dbStore);
  fse.writeJsonSync(auditdbStorePath, auditdbStore);
  fse.writeJsonSync(deployConfigStorePath, deployConfigStore);
}

// 最大的资源存放数量，默认 30 个
const maxAssetCount = 30;

const adapter = new FileSync(dbStorePath);
const db = low(adapter);

const auditAdapter = new FileSync(auditdbStorePath);
const auditdb = low(auditAdapter);

const deployAdapter = new FileSync(deployConfigStorePath);
const deployConfigdb = low(deployAdapter);

const sshPath = path.join(os.homedir(), ".ssh/config");

/**
 * 用于 scp 同步成功后的消息通知，目前使用 telegram 机器人通知机制
 */
const scpNotifyConfig = (options) => {
  const url = 'http://localhost:43343/scp';
  request({
    uri: url,
    method: 'POST',
    json: {
      ...options,
    }
  });
};

/**
 * TODO: 默认初始化两个模块
 * 1. 管理此 web server 的模版
 * 2. 管理默认管理中心的模版
 */
db.defaults({
  version: 1,
  projects: {
    [adminDirName]: {
      "id": adminDirName,
      "projName": "Admin",
      "createdDate": Date.now(),
      "projCode": adminDirName,
      "founder": "admin",
      "collaborators": {},
      "collaboratorApplies": [],
      "assetsCount": 0,
      "_deployPath": adminResourcePath,
      "assetNumb": 0
    }
  },
  assets: {},
}).write();

auditdb.defaults({}).write();

module.exports = {
  dbStorePath,
  staticServerPath,
  zipAssetsStorePath,
  remoteZipStorePath,
  maxAssetCount,
  adminResourcePath,
  sshPath,
  scpNotifyConfig,
  superPowerChecker,
  deployConfigdb,
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
    };
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
    console.log(nextState);
    auditdb.get(`${projId}`).push(nextState).write();
  },
  getAudit: (projId) => {
    return [...(auditdb.get(`${projId}`).value() || [])].reverse();
  }
};