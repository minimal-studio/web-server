const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fse = require('fs-extra');

const dbStorePath = path.join(process.cwd(), './f-e-deployment-store/store.json');
const staticServerPath = path.join(process.cwd(), './assets/public');
const zipAssetsStorePath = path.join(process.cwd(), './assets/zips');

try {
  fse.ensureFileSync(dbStorePath);
} catch(e) {
  fse.writeJsonSync(dbStorePath, {});
  fse.mkdir(zipAssetsStorePath);
}

const adapter = new FileSync(dbStorePath);
const db = low(adapter);

db.defaults({
  version: 1,
  projects: {},
  releaseLog: {},
  assets: {},
}).write();

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
  releaseNote: (projId, note) => {
    note.date = Date.now();
    note.operator = note.username;
    delete note.username;
    if(!db.get(`releaseLog.${projId}`).value()) {
      db.set(`releaseLog.${projId}`, []).write();
    }
    db.get(`releaseLog.${projId}`).push(note).write();
  }
}