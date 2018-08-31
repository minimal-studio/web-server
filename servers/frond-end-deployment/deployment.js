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

const { db, getAssetsPath, zipAssetsStorePath, releaseNote } = config;

function objToArr(obj, deleteFields) {
  let result = [];
  deleteFields = Array.isArray(deleteFields) ? deleteFields : [deleteFields];
  for (const key in obj) {
    let item = Object.assign({}, obj[key]);
    deleteFields.forEach(delF => {
      if(item.hasOwnProperty(delF)) delete item[delF];
    })
    result.push(item);
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

const checkProjAuth = (req, res, next) => {
  let { username, projId, assetId } = req.body;
  let currProjConfig = db.get(`projects.${projId}`).value();
  let currAssetConfig = db.get(`assets.${assetId}`).value();

  let assetConfig = {
    username,
    project: currProjConfig,
    asset: currAssetConfig,
  }

  if(currProjConfig.founder == username || !!currProjConfig.collaborators[username]) {
    assetConfig.isPass = true;
  } else {
    assetConfig.isPass = false;
  }

  req.assetConfig = assetConfig;

  next();
}

deploymentRouter.get('/project', (req, res) => {
  let { projId, user } = req.query;
  if(!user) res.json({ err: 'must pass username' });
  let result;
  if(projId) {
    result = db.get(`projects.${projId}`).sortBy('createdDate').value();
  } else {
    result = objToArr(db.get(`projects`).value(), 'deployPath');
  }
  res.json({
    err: null,
    data: result
  });
});

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
  releaseNote(createProjId, {
    username,
    note: projDesc,
    type: 'createProj'
  });

  res.json({
    err: null,
    projId: createProjId
  });
});

deploymentRouter.post('/release', [jsonParser, checkProjAuth], (req, res) => {
  let { project, asset, isPass } = req.assetConfig;
  if(isPass) {
    let zipFilePath = path.join(zipAssetsStorePath, asset.id + '.zip');
    let outputPath = project.deployPath;

    let noteFile = path.join(outputPath, './q.json');

    try {
      fse.ensureFileSync(noteFile);
    } catch(e) {
      fse.writeJsonSync(noteFile, {});
    }

    unzipFile(zipFilePath, outputPath).then(() => {
      // console.log('success')
      let { username, projId, assetId } = req.body;
      let releaseLog = {
        operator: username,
        version: asset.version,
        note: asset.desc,
        type: 'release'
      };
      project.releaseRef = assetId;
      db.set(`projects.${projId}`, project).write();
      releaseNote(projId, releaseLog);
      res.json({
        err: null
      });
    });
  } else {
    return res.json({
      err: 'You have no promission to release this project'
    })
  }
});

deploymentRouter.post('/edit-project', (req, res) => {
  res.send('put project')
});

deploymentRouter.post('/del-project', (req, res) => {
  res.send('delete project')
});

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
    releaseNote(projId, releaseLog);
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

deploymentRouter.get('/assets', (req, res) => {
  let { projId } = req.query;
  if(!projId) {
    let assetsObj = db.get('assets').sortBy('createdDate').value();
    return res.json(objToArr(assetsObj));
  } else {
    let assetsList = db.get('assets').find({
      belongto: projId
    }).value();
    res.json(assetsList);
  }
});

deploymentRouter.post('/rollback', jsonParser, (req, res) => {
  let { projId, assetId, why,  } = req.body;
});

module.exports = deploymentRouter;
