const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const storePath = path.join(process.cwd(), './f-e-deployment-store/store.json');
const assetStorePath = path.join(process.cwd(), './assets/public');

const adapter = new FileSync(storePath);
const db = low(adapter);

db.defaults({
  version: 1,
  projects: {},
  assets: {}
}).write();

module.exports = {
  port: 6650,
  storePath,
  assetStorePath,
  getAssetsPath: (projName) => {
    let assetDir = path.join(assetStorePath, projName);
    let zipStorePath = path.join(assetDir, './zips');
    let deployStorePath = path.join(assetDir, './deploy');

    return {
      deployStorePath, zipStorePath, assetDir
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
  }
}