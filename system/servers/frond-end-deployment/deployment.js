const uuidv3 = require('uuid/v3');
const path  = require('path');
// const fse  = require('fs-extra');
const fs  = require('fs');
const _ = require('lodash');
const { exec } = require('child_process');

const bodyParser = require('koa-bodyParser');
const Router = require('koa-router');

const sshParser = require('./ssh-config-parser');
const {
  db, getDeployPath, zipAssetsStorePath, remoteZipStorePath,
  audit, getAudit, maxAssetCount, sshPath,
  staticServerPath
} = require('./config');
const unzipFile = require('./unzip');
const { objToArr, findAll, entityMerge } = require('./utils');
const uploader = require('./uploader')(zipAssetsStorePath);

const projectEntity = require('./entities/project');
const assetEntity = require('./entities/asset');

const deploymentRouter = new Router();
deploymentRouter.use(bodyParser());

const resFilter = async (ctx, next) => {
  ctx.set({
    'Cache-Control': 'privat:, no-cache, no-store, must-revalidate',
    'Expires': '-1',
    'Pragma': 'no-cache'
  });
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
const checkProjAuth = async (ctx, next) => {
  let { username, projId, assetId } = ctx.request.body;

  if(!username) return ctx.body = {err: 'username is required'};
  if(!projId) return ctx.body = {err: 'projId is required'};
  
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
    return ctx.body = {
      err: 'You have no promission to do that.'
    };
  }

  ctx.assetConfig = assetConfig;

  await next();
};

/**
 * query project
 */
const getProjectList = async (ctx, next) => {
  let { projId, user, range } = ctx.request.query;
  if(!user) return ctx.body = { err: 'must pass username' };

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
    result = objToArr(projectData, null, 0);
  }
  ctx.body = {
    err: null,
    data: result
  };

  await next();
};

/**
 * create project
 */
const createProject = async (ctx, next) => {
  const {
    username, projName, projCode, projDesc
  } = ctx.request.body;

  let isProjExist = !!db.get('projects').find({
    projCode
  }).value();

  if(isProjExist) return ctx.body = {
    err: projCode + ' is exist'
  };

  if(!username || !projCode || !projName) return ctx.body = {
    err: true,
    desc: 'username, projName, projCode are required.'
  };

  const createProjId = uuidv3(projName + projCode + username, uuidv3.DNS);
  
  let newProject = entityMerge(ctx.request.body, projectEntity);
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

  ctx.body = {
    err: null,
    data: newProject
  };

  await next();
};

const releaseAsset = async (ctx, next) => {
  const { project, asset } = ctx.assetConfig;
  let zipFilePath = path.join(zipAssetsStorePath, asset.id + '.zip');
  let outputPath = project._deployPath || getDeployPath(project.projCode);

  if(!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }

  unzipFile(zipFilePath, outputPath);

  await next();
};

/**
 * get ssh-host list
 */
const getSshHosts = async (ctx) => {
  let hostMapper = getSSHHostList();
  ctx.body = {
    err: null,
    data: Object.keys(hostMapper),
    mapper: hostMapper
  };
};

/**
 * release specified asset of specified project
 */
const handleRelease = async (ctx, next) => {
  let { project, asset } = ctx.assetConfig;
  releaseAsset(ctx.assetConfig).then(() => {
    let {
      username, projId, assetId,
      isCallHook, isExecScp
    } = ctx.request.body;

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
      case 'push-files':
        // 把解压了的资源推送到目标服务器
        let sourcePath = path.join(staticServerPath, projCode, scpSourceDir, '*');

        scpCommand = `ssh ${scpTargetHost} 'mkdir -p ${targetPath}';` +
                     `scp -rB ${sourcePath} ${scpTargetHost}:${targetPath};`;
        break;
      }

      if(!scpCommand) return ctx.body = {
        err: '请检查 pushMode 是否正确: push-zip | push-files'
      };
      
      exec(scpCommand, (err) => {
        ctx.body = {
          err: err ? (err + '') : null
        };
      });
    } else {
      ctx.body = {
        err: execRes ? (execRes + '') : null
      };
    }
  }, () => {
    return ctx.body = {
      err: 'File not exist.'
    };
  }).catch((err) => {
    return ctx.body = {
      err: err + ''
    };
  });

  await next();
};

/**
 * rollback
 */
const handleRollback = async (ctx, next) => {
  let { project, asset } = ctx.assetConfig;
  releaseAsset(ctx.assetConfig).then(() => {
    let { username, projId, assetId, rollbackMark, prevAssetId } = ctx.request.body;
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
    ctx.body = {
      err: null
    };
  }, () => {
    return ctx.body = {
      err: 'File not exist.'
    };
  }).catch((err) => {
    return ctx.body = {
      err: err + ''
    };
  });

  await next();
};

/**
 * update project whit simple auth
 */
const updateProject = async (ctx, next) => {
  let { project } = ctx.assetConfig;

  let nextProj = entityMerge({
    ...project,
    ...ctx.request.body,
    motifyDate: Date.now(),
  }, projectEntity);

  db.set(`projects.${project.id}`, nextProj).write();
  ctx.body = {
    err: null,
    data: nextProj
  };

  await next();
};

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
const deleteProject = async (ctx, next) => {
  const { projId } = ctx.request.body;

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
      ctx.body = {
        err: null,
      };
    })
    .catch(err => {
      ctx.body = {
        err: err + '',
      };
    });

  await next();
};

/**
 * 加入协作
 */
const applyToJoin = async (ctx) => {
  let { projId, username } = ctx.request.body;
  db.update(
    `projects.${projId}.collaboratorApplies`,
    o => {
      let res = [...o];
      if(!_.includes(res, username)) res.push(username);
      return res;
    }
  ).write();
  ctx.body = {
    err: null
  };
};

/**
 * 加入协作
 */
const approveJoinToProject = async (ctx) => {
  let { projId, applicant, updatable, deletable, releasable } = ctx.request.body;
  if(!applicant) return ctx.body = {
    err: 'need to pass applicant'
  };

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

  ctx.body = {
    err: null
  };
};

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
const handleUpload = async (ctx, next) => {
  await next();
  return ctx.body = {
    err: 'err',
    data: 'targetProject'
  };
  // if(!ctx.req.file) return ctx.body = {
  //   err: 'no upload files'
  // };

  // const { founder, projId } = ctx.req.body;

  // let targetProject = db.get(`projects.${projId}`).value();
  // let { assetNumb } = targetProject;

  // let err = null;
  // let nextAssetState = {};

  // if(targetProject.founder == founder || !!targetProject.collaborators[founder]) {
  //   let currVersion = (+assetNumb || 0) + 1;
  //   let assetId = ctx.req.file.filename.split('.')[0];
  //   nextAssetState = {
  //     ...entityMerge({...ctx.req.body}, assetEntity),
  //     belongto: projId,
  //     id: assetId,
  //     createdDate: Date.now(),
  //     version: currVersion
  //   };

  //   let releaseLog = {
  //     username: founder,
  //     type: 'createAsset'
  //   };

  //   db.set(`assets.${assetId}`, nextAssetState).write();
  //   db
  //     .update(`projects.${projId}.assetsCount`, n => (n || 0) + 1)
  //     .update(`projects.${projId}.assetNumb`, n => (n || 0) + 1)
  //     .write();

  //   audit(projId, releaseLog);

  //   if(currVersion > maxAssetCount) {
  //     clearAsset(targetProject);
  //   }
  // } else {
  //   err = 'You have no promission to update this project';
  // }
  // ctx.body = {
  //   err: err,
  //   data: nextAssetState
  // };
};

/**
 * query assets
 */
const getAssets = async (ctx) => {
  let { projId } = ctx.request.query;
  let assetListObjData = {};
  if(!projId) {
    assetListObjData = db.get('assets').sortBy('version').value();
    return ctx.body = objToArr(assetListObjData);
  } else {
    let assetsData = db.get('assets').value();
    assetListObjData = findAll(assetsData, {belongto: projId});
  }
  ctx.body = {
    err: null,
    data: objToArr(assetListObjData)
  };
};

/**
 * query assets
 */
const delAsset = async (ctx) => {
  let { projId, assetId, username } = ctx.request.body;
  let unlinkFilePath = path.join(zipAssetsStorePath, assetId + '.zip');
  fs.unlink(unlinkFilePath, (err) => {
    if(err) return ctx.body = {
      err: 'This file did not exist.'
    };
    let releaseLog = {
      username,
      type: 'deleteAsset'
    };
    db.unset(`assets.${assetId}`).write();
    db.update(`projects.${projId}.assetsCount`, n => n - 1).write();
    audit(projId, releaseLog);
    ctx.body = {
      err: null
    };
  });
};

/**
 * audit log
 */
const getAutid = async (ctx) => {
  let { projId } = ctx.request.query;
  if(!projId) {
    ctx.body = {
      err: 'need projId.'
    };
  } else {
    ctx.body = {
      err: null,
      data: getAudit(projId)
    };
  }
};

const downloadAsset = async (ctx) => {
  let { assetId } = ctx.request.query;
  if(!assetId) return ctx.body = {err: 'need pass assetId'};
  const fileName = assetId + '.zip';
  const zipFile = path.join(zipAssetsStorePath, fileName);

  ctx.set({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': 'attachment; filename=' + fileName
  });

  fs.createReadStream(zipFile).pipe(ctx.response);
};

deploymentRouter.put('/project', checkProjAuth, updateProject);

deploymentRouter.post('/release', checkProjAuth, handleRelease);
deploymentRouter.post('/rollback', checkProjAuth, handleRollback);
deploymentRouter.post('/upload', handleUpload, uploader.single('assetZip'));
deploymentRouter.post('/del-asset', checkProjAuth, delAsset);
deploymentRouter.post('/join', applyToJoin);
deploymentRouter.post('/project', createProject);
deploymentRouter.post('/approve', checkProjAuth, approveJoinToProject);

deploymentRouter.delete('/project', checkProjAuth, deleteProject);
deploymentRouter.delete('/assets', checkProjAuth, delAsset);

deploymentRouter.get('/download-asset', downloadAsset);
deploymentRouter.get('/assets', getAssets);
deploymentRouter.get('/audit', getAutid);
deploymentRouter.get('/ssh-host', getSshHosts);
deploymentRouter.get('/project', getProjectList);

module.exports = deploymentRouter;
