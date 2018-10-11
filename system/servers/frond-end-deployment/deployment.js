const express = require('express');
const bodyParser = require('body-parser');
const uuidv3 = require('uuid/v3');
const path  = require('path');
// const fse  = require('fs-extra');
const fs  = require('fs');
const _ = require('lodash');
const { exec } = require('child_process');

const sshParser = require('./ssh-config-parser');
const {
  db, getDeployPath, zipAssetsStorePath, remoteZipStorePath,
  audit, getAudit, maxAssetCount, sshPath,
  staticServerPath
} = require('./config');
const unzipFile = require('./unzip');
const { objToArr, findAll, entityMerge } = require('./utils');
const uploader = require('./uploader');

const projectEntity = require('./entities/project');
const assetEntity = require('./entities/asset');

const upload = uploader(zipAssetsStorePath);

let deploymentRouter = express.Router();

const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });

const resFilter = (req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
};

deploymentRouter.use(resFilter);

const getSSHHostList = () => {
  try {
    let readRes = fs.readFileSync(sshPath, "utf8");
    return sshParser(readRes);
  } catch(e) {
    return null;
  }
};

/**
 * 简易的用户权限判断中间件
 * 根据 project 的 founder 和 collaborators 来判断
 * 如果没有对应的权限，会直接返回
 */
const checkProjAuth = (req, res, next) => {
  let { username, projId, assetId } = req.body;

  if(!username) return res.json({err: 'username is required'});
  if(!projId) return res.json({err: 'projId is required'});
  
  let currProjConfig = db.get(`projects.${projId}`).value();
  let currAssetConfig = db.get(`assets.${assetId}`).value();

  let assetConfig = {
    username,
    project: currProjConfig,
    asset: currAssetConfig,
  };

  if(username && currProjConfig && (currProjConfig.founder === username || currProjConfig.collaborators[username])) {
    assetConfig.isPass = true;
  } else {
    assetConfig.isPass = false;
    return res.json({
      err: 'You have no promission to do that.'
    });
  }

  req.assetConfig = assetConfig;

  next();
};

/**
 * query project
 */
const getProjectList = (req, res) => {
  let { projId, user, range } = req.query;
  if(!user) res.json({ err: 'must pass username' });
  let result;
  if(projId) {
    result = Object.assign({}, db.get(`projects.${projId}`).value());
  } else {
    let projectObj = db.get(`projects`).value();
    let projectData = {};
    if(range) {
      switch (range) {
      case 'all':
        projectData = projectObj;
        break;
      case 'me':
        projectData = findAll(projectObj, {founder: user});
        break;
      case 'join':
        projectData = findAll(projectObj, {collaborators: (o) => {
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
};

/**
 * create project
 */
const createProject = [
  jsonParser, (req, res) => {
    const {
      username, projName, projCode, projDesc
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
    
    let newProject = entityMerge(req.body, projectEntity);
    Object.assign(newProject, {
      id: createProjId,
      createdDate: Date.now(),
      founder: username
    });
    
    db.set(`projects.${createProjId}`, newProject).write();
    audit(createProjId, {
      username,
      note: projDesc,
      type: 'createProj'
    });
  
    res.json({
      err: null,
      data: newProject
    });
  }
];

const releaseAsset = ({ project, asset }) => {
  let zipFilePath = path.join(zipAssetsStorePath, asset.id + '.zip');
  let outputPath = project._deployPath || getDeployPath(project.projCode);

  if(!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }

  return unzipFile(zipFilePath, outputPath);
};

/**
 * get ssh-host list
 */
const getSshHosts = (req, res) => {
  let hostMapper = getSSHHostList();
  res.json({
    err: null,
    data: Object.keys(hostMapper),
    mapper: hostMapper
  });
};

/**
 * release specified asset of specified project
 */
const handleRelease = [
  jsonParser, checkProjAuth,
  (req, res) => {
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
        let { projCode, scpSourceDir = '', scpTargetHost, scpTargetDir, pushMode = 'push-files' } = project;
        let targetPath = path.join(scpTargetDir, projCode);
        let scpCommand = '';

        switch (pushMode) {
        // 把资源压缩包推送到目标服务器再解压
        case 'push-zip':
          let zipFileName = asset.id + '.zip';
          let zipFilePath = path.join(zipAssetsStorePath, zipFileName);
          let remoteSrourceFilePath = scpSourceDir ? path.join(targetPath, scpSourceDir, '*') : null;
          let remoteZipFilePath = path.join(remoteZipStorePath, zipFileName);
          let mvToPath = targetPath;

          scpCommand = `ssh ${scpTargetHost} 'mkdir -p ${remoteZipStorePath}';` + 
                        `scp ${zipFilePath} ${scpTargetHost}:${remoteZipStorePath};` + 
                        `ssh ${scpTargetHost} 'mkdir -p ${targetPath};` + 
                        `unzip -o ${remoteZipFilePath} -d ${targetPath};` + 
                        `${remoteSrourceFilePath ? `cp -rf ${remoteSrourceFilePath} ${mvToPath}` : ''}'`;
          break;
        // 把解压了的资源推送到目标服务器
        case 'push-files':
          let sourcePath = path.join(staticServerPath, projCode, scpSourceDir, '*');

          scpCommand = `ssh ${scpTargetHost} 'mkdir -p ${targetPath}';` +
                        `scp -rB ${sourcePath} ${scpTargetHost}:${targetPath};`;
          break;
        }

        if(!scpCommand) return res.json({
          err: '请检查 pushMode 是否正确: push-zip | push-files'
        });
        
        exec(scpCommand, (err) => {
          // console.log(err)
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
  }
];

/**
 * rollback
 */
const handleRollback = [
  jsonParser, checkProjAuth,
  (req, res) => {
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
  }
];

/**
 * update project whit simple auth
 */
const updateProject = [
  jsonParser, checkProjAuth,
  (req, res) => {
    let { project } = req.assetConfig;

    let nextProj = entityMerge({
      ...project,
      ...req.body,
      motifyDate: Date.now(),
    }, projectEntity);

    db.set(`projects.${project.id}`, nextProj).write();
    res.json({
      err: null,
      data: nextProj
    });
  }
];

const removeAllAssets = (assetList) => {
  let allActions = [];
  
  for (const assetId in assetList) {
    if (assetList.hasOwnProperty(assetId)) {
      // const currAsset = assetList[assetId];
      allActions.push(new Promise((resolve, reject) => {
        fs.unlink(path.join(zipAssetsStorePath, assetId + '.zip'), (err) => {
          if(err) return reject(err);
          resolve();
        });
      }));
    }
  }

  return Promise.all(allActions);
};

/**
 * delete project
 */
const deleteProject = [
  jsonParser, checkProjAuth,
  (req, res) => {
    const { projId } = req.body;

    const assetDBObj = db.get(`assets`);

    const assetsData = assetDBObj.value();
    const assetList = findAll(assetsData, {belongto: projId});

    db.update('assets', o => {
      for (const id in o) {
        if(o[id].belongto === projId) delete o[id];
      }
      return o;
    }).write();
    db.unset(`projects.${projId}`).write();

    removeAllAssets(assetList)
      .then((success) => {
        res.json({
          err: null,
        });
      })
      .catch(err => {
        res.json({
          err: err + '',
        });
      });
  }
];

/**
 * 加入协作
 */
const applyToJoin = [
  jsonParser,
  (req, res) => {
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
  }
];

/**
 * 加入协作
 */
const approveJoinToProject = [
  jsonParser, checkProjAuth,
  (req, res) => {
    let { projId, applicant, updatable, deletable, releasable } = req.body;
    if(!applicant) return res.json({
      err: 'need to pass applicant'
    });
    db
      .update(`projects.${projId}.collaboratorApplies`, o => {
        let res = [...o];
        _.pull(res, applicant);
        return res;
      })
      .set(`projects.${projId}.collaborators.${applicant}`, {
        updatable, deletable, releasable
      })
      .write();
    res.json({
      err: null
    });
  }
];

const clearAsset = (project) => {
  return new Promise((resolve, reject) => {
    if(!project) reject('project is required.');
    let assets = [].concat(objToArr(db.get("assets").value(), null, 0));
    let delAsset = assets.slice(maxAssetCount);
    delAsset.forEach(item => {
      let assetId = item.id;
      let unlinkFilePath = path.join(zipAssetsStorePath, assetId + '.zip');
      fs.unlink(unlinkFilePath, (err) => {
        if(err) return reject(err);
        let releaseLog = {
          username: 'system',
          type: 'systemDeleteAsset'
        };
        db.unset(`assets.${assetId}`).write();
        db.update(`projects.${project.id}.assetsCount`, n => n - 1).write();
        audit(project.id, releaseLog);
        resolve();
      });
    });
  });
};

/**
 * handle uploaded asset
 */
const handleUpload = [
  upload.single('assetZip'),
  (req, res) => {
    if(!req.file) return res.json({err: 'no upload files'});
    const { founder, projId } = req.body;

    let targetProject = db.get(`projects.${projId}`).value();
    let { assetNumb } = targetProject;

    if(targetProject.founder == founder || !!targetProject.collaborators[founder]) {
      let currVersion = (+assetNumb || 0) + 1;
      let assetId = req.file.filename.split('.')[0];
      let nextAssetState = {
        ...entityMerge({...req.body}, assetEntity),
        belongto: projId,
        id: assetId,
        createdDate: Date.now(),
        version: currVersion
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
  }
];

/**
 * query assets
 */
const getAssets = (req, res) => {
  let { projId } = req.query;
  let assetListObjData = {};
  if(!projId) {
    assetListObjData = db.get('assets').sortBy('version').value();
    return res.json(objToArr(assetsObj));
  } else {
    let assetsData = db.get('assets').value();
    assetListObjData = findAll(assetsData, {belongto: projId});
  }
  res.json({
    err: null,
    data: objToArr(assetListObjData)
  });
};

/**
 * query assets
 */
const delAsset = [jsonParser, checkProjAuth, (req, res) => {
  let { projId, assetId, username } = req.body;
  let unlinkFilePath = path.join(zipAssetsStorePath, assetId + '.zip');
  fs.unlink(unlinkFilePath, (err) => {
    if(err) return res.json({
      err: 'This file did not exist.'
    });
    let releaseLog = {
      username,
      type: 'deleteAsset'
    };
    db.unset(`assets.${assetId}`).write();
    db.update(`projects.${projId}.assetsCount`, n => n - 1).write();
    audit(projId, releaseLog);
    res.json({
      err: null
    });
  });
}];

/**
 * audit log
 */
const getAutid = (req, res) => {
  let { projId } = req.query;
  if(!projId) {
    res.json({
      err: 'need projId.'
    });
  } else {
    res.json({
      err: null,
      data: getAudit(projId)
    });
  }
};

const downloadAsset = (req, res) => {
  let { assetId } = req.query;
  if(!assetId) return res.json({err: 'need pass assetId'});
  const fileName = assetId + '.zip';
  const zipFile = path.join(zipAssetsStorePath, fileName);

  res.set({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': 'attachment; filename=' + fileName
  });

  fs.createReadStream(zipFile).pipe(res);
};

deploymentRouter.put('/project', updateProject);

deploymentRouter.post('/release', handleRelease);
deploymentRouter.post('/rollback', handleRollback);
deploymentRouter.post('/upload', handleUpload);
deploymentRouter.post('/del-asset', delAsset);
deploymentRouter.post('/join', applyToJoin);
deploymentRouter.post('/project', createProject);
deploymentRouter.post('/approve', approveJoinToProject);

deploymentRouter.delete('/project', deleteProject);
deploymentRouter.delete('/assets', delAsset);

deploymentRouter.get('/download-asset', downloadAsset);
deploymentRouter.get('/assets', getAssets);
deploymentRouter.get('/audit', getAutid);
deploymentRouter.get('/ssh-host', getSshHosts);
deploymentRouter.get('/project', getProjectList);

module.exports = deploymentRouter;
