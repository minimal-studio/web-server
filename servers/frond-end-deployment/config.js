const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fse = require('fs-extra');

const dbStorePath = path.join(process.cwd(), './f-e-deployment-store/store.json');
const auditdbStorePath = path.join(process.cwd(), './f-e-deployment-store/audit-store.json');
const staticServerPath = path.join(process.cwd(), './assets/public');
const zipAssetsStorePath = path.join(process.cwd(), './assets/zips');

try {
  fse.ensureFileSync(dbStorePath);
} catch(e) {
  fse.writeJsonSync(dbStorePath, {});
  fse.writeJsonSync(auditdbStorePath, {});
  fse.mkdir(zipAssetsStorePath);
}

const adapter = new FileSync(dbStorePath);
const db = low(adapter);

const auditAdapter = new FileSync(auditdbStorePath);
const auditdb = low(auditAdapter);

db.defaults({
  version: 1,
  projects: {},
  assets: {},
}).write();

auditdb.defaults({}).write();

module.exports = {
  port: 6650,
  dbStorePath,
  staticServerPath,
  zipAssetsStorePath,
  getAssetsPath: (projCode) => {
    let assetDir = path.join(staticServerPath, projCode);
    // let deployStorePath = path.join(assetDir, './deploy');
    let deployStorePath = assetDir;

    return {
      deployStorePath, assetDir, 
    }
  },
  db,
  adapter,
  wrapRes: (data, header) => {
    header = header || {
      err: false,
      code: 0
    };
    return {
      header,
      data
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
    console.log(nextState)
    auditdb.get(`${projId}`).push(nextState).write();
  },
  getAudit: (projId) => {
    return auditdb.get(`${projId}`).value();
  }
}