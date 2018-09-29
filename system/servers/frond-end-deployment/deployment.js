const express = require('express');
const bodyParser = require('body-parser');
const uuidv3 = require('uuid/v3');
const uuidv1 = require('uuid/v1');
const path  = require('path');
const multer  = require('multer');
// const fse  = require('fs-extra');
const fs  = require('fs');
const _ = require('lodash');
const { exec } = require('child_process');
const sshParser = require('./ssh-config-parser');

const {
  db, getDeployPath, zipAssetsStorePath, 
  audit, getAudit, maxAssetCount, sshPath,
  staticServerPath
} = require('./config');
const unzipFile = require('./unzip');

let deploymentRouter = express.Router();

const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });

const resFilter = (req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
}

const getSSHHostList = () => {
  try {
    let readRes = fs.readFileSync(sshPath, "utf8")
    return sshParser(readRes);
  } catch(e) {
    return null;
  }
}

deploymentRouter.use(resFilter);

/**
 * convert obj to array
 */
function objToArr(obj, filter, limit = 30) {
  let hasFilter = _.isFunction(filter);
  let result = [];
  let taked = 0;
  for (const key in obj) {
    if(taked == limit) return;
    let item = Object.assign({}, obj[key]);
    hasFilter ? item = filter({...item}) || item : null;
    result.push(item);
    taked++;
  }
  return result.reverse();
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

  if(!username) return res.json({err: 'username is required'});
  if(!projId) return res.json({err: 'projId is required'});
  
  let currProjConfig = db.get(`projects.${projId}`).value() || {};
  let currAssetConfig = db.get(`assets.${assetId}`).value() || {};

  let assetConfig = {
    username,
    project: currProjConfig,
    asset: currAssetConfig,
  }

  if(!!username && !!currProjConfig && (currProjConfig.founder === username || !!currProjConfig.collaborators[username])) {
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

function findAll(obj, findParams, filter) {
  let hasFilter = _.isFunction(filter);
  let res = {};
  for (const key in obj) {
    const item = obj[key];
    for (const targetKey in findParams) {
      const targetVal = findParams[targetKey];
      if(typeof targetVal == 'function') {
        if(targetVal(item)) {
          hasFilter ? item = filter(item) || item : null;
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
  } else {
    let projectObj = db.get(`projects`).value();
    let projectData = {};
    if(!!range) {
      switch (range) {
        case 'all':
          projectData = projectObj;
          break;
        case 'me':
          projectData = findAll(projectObj, {founder: user});
          break;
        case 'join':
          projectData = findAll(projectObj, {collaborators: (o) => {
            console.log(o.collaborators)
            return o.collaborators.hasOwnProperty(user);
          }});
          break;
      }
    }
    result = objToArr(projectData);
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
  const {
    username, projName, projCode, projDesc, webhook,
    scpTargetHost, scpSourceDir, scpTargetDir
  } = req.body;
  let isProjExist = !!db.get('projects').find({
    projCode
  }).value();
  if(isProjExist) return res.json({err: projCode + ' is exist'});
  if(!username || !projCode || !projName) return res.json({
    err: true,
    desc: 'username, projName, projCode are required.'
  });
  const createProjId = uuidv3(projName + projCode + username, uuidv3.DNS);
  // const { deployStorePath } = getAssetsPath(projCode);

  let newProj = {
    id: createProjId,
    projName,
    createdDate: Date.now(),
    projCode,
    projDesc,
    webhook,
    scpTargetHost, scpSourceDir, scpTargetDir,
    founder: username,
    collaborators: {},
    collaboratorApplies: [],
  };
  
  db.set(`projects.${createProjId}`, newProj).write();
  audit(createProjId, {
    username,
    note: projDesc,
    type: 'createProj'
  });

  res.json({
    err: null,
    data: newProj
  });
});

const releaseAsset = ({ project, asset }) => {
  let zipFilePath = path.join(zipAssetsStorePath, asset.id + '.zip');
  let outputPath = project._deployPath || getDeployPath(project.projCode);

  if(!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }

  return unzipFile(zipFilePath, outputPath);
}

/**
 * get ssh-host list
 */
deploymentRouter.get('/ssh-host', (req, res) => {
  let hostMapper = getSSHHostList();
  res.json({
    err: null,
    data: Object.keys(hostMapper),
    mapper: hostMapper
  });
});

/**
 * release specified asset of specified project
 */
deploymentRouter.post('/release', [jsonParser, checkProjAuth], (req, res) => {
  let { project, asset } = req.assetConfig;
  releaseAsset(req.assetConfig).then(() => {
    let {
      username, projId, assetId,
      isCallHook, isExecScp
    } = req.body;

    let releaseLog = {
      operator: username,
      version: asset.version,
      note: asset.desc,
      type: 'release'
    };

    project.releaseRef = assetId;
    db.set(`projects.${projId}`, project).write();
    db.set(`assets.${asset.id}.isReleased`, true).write();

    audit(projId, releaseLog);
    
    if(isCallHook) {
      // TODO: 完善通知机制

    }

    let execRes;

    if(isExecScp) {
      let { projCode, scpSourceDir, scpTargetHost, scpTargetDir } = project;
      let sourcePath = path.join(staticServerPath, projCode, scpSourceDir, '*');
      let targetPath = path.join(scpTargetDir, projCode);
      let scpCommand = `ssh ${scpTargetHost} 'mkdir -p ${targetPath}'; scp -r ${sourcePath} ${scpTargetHost}:${targetPath}`;
      
      exec(scpCommand, (err) => {
        res.json({
          err: err ? (err + '') : null
        });
      });
    } else {
      res.json({
        err: execRes ? (execRes + '') : null
      });
    }
    
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
 * rollback
 */
deploymentRouter.post('/rollback', [jsonParser, checkProjAuth], (req, res) => {
  let { project, asset } = req.assetConfig;
  releaseAsset(req.assetConfig).then(() => {
    let { username, projId, assetId, rollbackMark, prevAssetId } = req.body;
    let releaseLog = {
      operator: username,
      version: asset.version,
      note: asset.desc,
      type: 'rollback'
    };
    let prevAssetConfig = Object.assign({}, db.get(`assets.${prevAssetId}`).value(), {
      isReleased: false,
      isRollback: true,
      rollbackMark,
      status: 'rollback'
    });
    let nextAssetConfig = Object.assign({}, asset, {
      isReleased: true,
      status: 'released'
    });
    project.releaseRef = assetId;
    db.set(`projects.${projId}`, project).write();
    db.set(`assets.${asset.id}`, nextAssetConfig).write();
    db.set(`assets.${prevAssetId}`, prevAssetConfig).write();
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
  let {
    projCode, projName, projDesc, webhook, host,
    scpTargetHost, scpSourceDir, scpTargetDir
  } = req.body;
  let nextProj = Object.assign({}, project, {
    motifyDate: Date.now(),
    projCode, projName, projDesc, webhook, host,
    scpTargetHost, scpSourceDir, scpTargetDir
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
  });
});

/**
 * 加入协作
 */
deploymentRouter.post('/join', [jsonParser], (req, res) => {
  let { projId, username } = req.body;
  db.update(
    `projects.${projId}.collaboratorApplies`,
    o => {
      let res = [...o];
      if(!_.includes(res, username)) res.push(username);
      return res;
    }
  ).write();
  res.json({
    err: null
  });
});

/**
 * 加入协作
 */
deploymentRouter.post('/approve', [jsonParser, checkProjAuth], (req, res) => {
  let { project, asset } = req.assetConfig;
  let { username, projId, applicant, updatable, deletable, releasable } = req.body;
  if(!applicant) return res.json({
    err: 'need to pass applicant'
  });
  db
    .update(`projects.${projId}.collaboratorApplies`, o => {
      let res = [...o];
      console.log(o)
      _.pull(res, applicant);
      console.log(res)
      return res;
    })
    .set(`projects.${projId}.collaborators.${applicant}`, {
      updatable, deletable, releasable
    })
    .write();
  res.json({
    err: null
  });
});

const clearAsset = (project) => {
  return new Promise((resolve, reject) => {
    if(!project) reject('project is required.');
    let asset = [...objToArr(db.get("assets").value())];
    let delAsset = asset.slice(maxAssetCount);
    delAsset.forEach(item => {
      let assetId = item.id;
      let unlinkFilePath = path.join(zipAssetsStorePath, assetId + '.zip');
      fs.unlink(unlinkFilePath, (err) => {
        if(err) return reject(err);
        let releaseLog = {
          username: 'system',
          type: 'systemDeleteAsset'
        }
        db.unset(`assets.${assetId}`).write();
        db.update(`projects.${project.id}.assetsCount`, n => n - 1).write();
        audit(project.id, releaseLog);
        resolve();
      });
    });
  })
}

/**
 * handle uploaded asset
 */
deploymentRouter.post('/upload', upload.single('assetZip'), (req, res) => {
  if(!req.file) return res.json({err: 'no upload files'});
  const { founder, projId } = req.body;
  let targetProject = db.get(`projects.${projId}`).value();
  let { assetNumb } = targetProject;
  if(targetProject.founder == founder || !!targetProject.collaborators[founder]) {
    let { desc } = req.body;
    let currVersion = (+assetNumb || 0) + 1;
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
    };
    let releaseLog = {
      username: founder,
      type: 'createAsset'
    };
    db.set(`assets.${assetId}`, nextAssetState).write();
    db
      .update(`projects.${projId}.assetsCount`, n => (n || 0) + 1)
      .update(`projects.${projId}.assetNumb`, n => (n || 0) + 1)
      .write();
    audit(projId, releaseLog);
    if(currVersion > maxAssetCount) {
      clearAsset(targetProject);
    }
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
  let assetListObjData = {};
  if(!projId) {
    assetListObjData = db.get('assets').sortBy('createdDate').value();
    return res.json(objToArr(assetsObj));
  } else {
    let assetsData = db.get('assets').value();
    assetListObjData = findAll(assetsData, {belongto: projId});
  }
  res.json({
    err: null,
    data: objToArr(assetListObjData)
  });
});

/**
 * query assets
 */
deploymentRouter.post('/del-asset', [jsonParser, checkProjAuth], (req, res) => {
  let { project } = req.assetConfig;
  let { projId, assetId, username } = req.body;
  let unlinkFilePath = path.join(zipAssetsStorePath, assetId + '.zip');
  fs.unlink(unlinkFilePath, (err) => {
    if(err) return res.json({
      err: 'This file did not exist.'
    });
    let releaseLog = {
      username,
      type: 'deleteAsset'
    }
    db.unset(`assets.${assetId}`).write();
    db.update(`projects.${projId}.assetsCount`, n => n - 1).write();
    audit(projId, releaseLog);
    res.json({
      err: null
    });
  });
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
      data: getAudit(projId)
    });
  }
});

module.exports = deploymentRouter;
