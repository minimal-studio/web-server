const express = require('express');
const bodyParser = require('body-parser')
const uuidv3 = require('uuid/v3');
const uuidv1 = require('uuid/v1');
const path  = require('path');
const multer  = require('multer');
const fse  = require('fs-extra');

const config = require('./config');
const unzipFile = require('./unzip');

let deploymentRouter = express.Router();

const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });

const { db, getAssetsPath, zipAssetsStorePath, audit, getAudit } = config;

/**
 * convert obj to array
 */
function objToArr(obj, deleteFields, limit = 30) {
  let result = [];
  let taked = 0;
  deleteFields = Array.isArray(deleteFields) ? deleteFields : [deleteFields];
  for (const key in obj) {
    if(taked == limit) return;
    let item = Object.assign({}, obj[key]);
    deleteFields.forEach(delF => {
      if(item.hasOwnProperty(delF)) delete item[delF];
    });
    result.push(item);
    taked++;
  }
  return result;
}

const fileStorageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, zipAssetsStorePath);
  },
  filename: (req, file, cb) => {
    let filename = uuidv1() + '.zip';
    cb(null, filename);
  }
});
const upload = multer({storage: fileStorageConfig});

/**
 * 简易的用户权限判断中间件
 * 根据 project 的 founder 和 collaborators 来判断
 * 如果没有对应的权限，会直接返回
 */
const checkProjAuth = (req, res, next) => {
  let { username, projId, assetId } = req.body;
  let currProjConfig = db.get(`projects.${projId}`).value() || {};
  let currAssetConfig = db.get(`assets.${assetId}`).value() || {};

  let assetConfig = {
    username,
    project: currProjConfig,
    asset: currAssetConfig,
  }

  if(!!username && (currProjConfig.founder == username || !!currProjConfig.collaborators[username])) {
    assetConfig.isPass = true;
  } else {
    assetConfig.isPass = false;
    return res.json({
      err: 'You have no promission to do that.'
    });
  }

  req.assetConfig = assetConfig;

  next();
}

function findAll(obj, findParams) {
  let res = {};
  for (const key in obj) {
    const item = obj[key];
    for (const targetKey in findParams) {
      const targetVal = findParams[targetKey];
      if(typeof targetVal == 'function') {
        if(targetVal(item)) {
          res[key] = item;
        }
      } else if(item[targetKey] == targetVal) {
        res[key] = item;
      }
    }
  }
  return res;
}

/**
 * query project
 */
deploymentRouter.get('/project', (req, res) => {
  let { projId, user, range } = req.query;
  if(!user) res.json({ err: 'must pass username' });
  let result;
  if(projId) {
    result = Object.assign({}, db.get(`projects.${projId}`).value());
    delete result['deployPath'];
  } else {
    let projectObj = db.get(`projects`).value();
    let projectData = {};
    if(!!range) {
      switch (range) {
        case 'me':
          projectData = findAll(projectObj, {founder: user});
          break;
        case 'join':
          projectData = findAll(projectObj, {collaborators: (o) => {
            return o.hasOwnProperty(user);
          }});
          break;
        case 'all':
          projectData = projectObj;
          break;
      }
    }
    result = objToArr(projectData, 'deployPath');
  }
  res.json({
    err: null,
    data: result
  });
});

/**
 * create project
 */
deploymentRouter.post('/project', jsonParser, (req, res) => {
  const { username, projName, projCode, projDesc, webhook } = req.body;
  let isProjExist = !!db.get('projects').find({
    projCode
  }).value();
  if(isProjExist) return res.json({err: 'project exist'});
  if(!username || !projCode || !projName) return res.json({
    err: true,
    desc: 'username, projName, projCode are required.'
  });
  const createProjId = uuidv3(projName + projCode + username, uuidv3.DNS);
  const { deployStorePath } = getAssetsPath(projCode);

  let newProj = {
    id: createProjId,
    projName,
    createdDate: Date.now(),
    projCode,
    projDesc,
    webhook,
    founder: username,
    collaborators: {},
    deployPath: deployStorePath,
  };
  
  db.set(`projects.${createProjId}`, newProj).write();
  audit(createProjId, {
    username,
    note: projDesc,
    type: 'createProj'
  });

  res.json({
    err: null,
    projId: createProjId
  });
});

/**
 * release specified asset of specified project
 */
deploymentRouter.post('/release', [jsonParser, checkProjAuth], (req, res) => {
  let { project, asset } = req.assetConfig;
  let zipFilePath = path.join(zipAssetsStorePath, asset.id + '.zip');
  let outputPath = project.deployPath;

  let noteFile = path.join(outputPath, './q');

  try {
    fse.ensureFileSync(noteFile);
  } catch(e) {
    fse.writeFileSync(noteFile, '');
  }

  unzipFile(zipFilePath, outputPath).then(() => {
    let { username, projId, assetId } = req.body;
    let releaseLog = {
      operator: username,
      version: asset.version,
      note: asset.desc,
      type: 'release'
    };
    project.releaseRef = assetId;
    db.set(`projects.${projId}`, project).write();
    audit(projId, releaseLog);
    res.json({
      err: null
    });
  }, () => {
    return res.json({
      err: 'File not exist.'
    });
  }).catch((err) => {
    return res.json({
      err: err + ''
    });
  });
});

/**
 * update project whit simple auth
 */
deploymentRouter.put('/project', [jsonParser, checkProjAuth], (req, res) => {
  let { project } = req.assetConfig;
  let { projCode, projName, projDesc, webhook } = req.body;
  let nextProj = Object.assign({}, project, {
    motifyDate: Date.now(),
    projCode, projName, projDesc, webhook
  });
  db.set(`projects.${project.id}`, nextProj).write();
  res.json({
    err: null,
    data: nextProj
  })
});

/**
 * delete project
 */
deploymentRouter.post('/del-project', [jsonParser, checkProjAuth], (req, res) => {
  // res.send('delete project')
  let { project, asset } = req.assetConfig;
  // console.log(project, asset)
  // TODO: 删除记录，并且删除文件
  res.json({
    err: 'not yet.'
  })
});

/**
 * handle uploaded asset
 */
deploymentRouter.post('/upload', upload.single('assetZip'), (req, res) => {
  const { founder, projId } = req.body;
  let targetProject = db.get(`projects.${projId}`).value();
  if(targetProject.founder == founder || !!targetProject.collaborators[founder]) {
    let { desc } = req.body;
    let assetState = db.get('assets').value();
    let currVersion = (Object.keys(assetState).length || 0) + 1;
    let assetId = req.file.filename.split('.')[0];
    let nextAssetState = {
      belongto: projId,
      id: assetId,
      createdDate: Date.now(),
      desc: desc,
      version: currVersion,
      isRollback: false,
      rollbackMark: '',
      founder
    }
    db.set(`assets.${assetId}`, nextAssetState).write();
    let releaseLog = {
      username: founder,
      type: 'createAsset'
    }
    audit(projId, releaseLog);
    return res.json({
      err: null,
      data: nextAssetState
    });
  } else {
    return res.json({
      err: 'You have no promission to update this project',
    });
  }
});

/**
 * query assets
 */
deploymentRouter.get('/assets', (req, res) => {
  let { projId } = req.query;
  if(!projId) {
    let assetsObj = db.get('assets').sortBy('createdDate').reverse().value();
    return res.json(objToArr(assetsObj));
  } else {
    let assetsList = db.get('assets').find({
      belongto: projId
    }).value();
    res.json(assetsList);
  }
});

/**
 * audit log
 */
deploymentRouter.get('/audit', (req, res) => {
  let { projId } = req.query;
  if(!projId) {
    res.json({
      err: 'need projId.'
    })
  } else {
    res.json({
      err: null,
      data: objToArr(getAudit(projId))
    });
  }
});

/**
 * rollback
 */
deploymentRouter.post('/rollback', jsonParser, (req, res) => {
  let { projId, assetId, why,  } = req.body;
});

module.exports = deploymentRouter;
