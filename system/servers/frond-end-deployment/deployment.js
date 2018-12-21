const uuidv3 = require('uuid/v3');
const path  = require('path');
// const fse  = require('fs-extra');
const fs  = require('fs');
const _ = require('lodash');
const { exec, execSync } = require('child_process');

const Router = require('koa-router');
const bodyParser = require('koa-body');

const sshParser = require('./ssh-config-parser');
const {
  db, getDeployPath, zipAssetsStorePath, remoteZipStorePath, deployConfigdb,
  audit, getAudit, maxAssetCount, sshPath, scpNotifyConfig,
  staticServerPath, superPowerChecker
} = require('./config');
const unzipFile = require('./unzip');
const { objToArr, findAll, entityMerge } = require('./utils');
const uploader = require('./uploader/save-file')(zipAssetsStorePath);
// const uploader = require('./uploader')(zipAssetsStorePath);

const projectEntity = require('./entities/project');
const assetEntity = require('./entities/asset');
const deployConfigEntity = require('./entities/deploy-config');

const deploymentRouter = new Router();
const assetUploadRouter = new Router();

deploymentRouter.use(bodyParser({
  strict: false
}));

const wrapAssetFileName = (assetId, traceMsg) => {
  if(!assetId) {
    console.log('assetId is need, at func ' + traceMsg);
    return '';
  }
  return assetId + '.zip';
};

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
 * 
 * TODO: 先允许 admin 做所有操作，后续再做细致的权限控制
 */
const checkProjAuth = async (ctx, next) => {
  const { username, projId, assetId } = ctx.request.body;

  if(!username) return ctx.body = {err: 'username is required'};
  if(!projId) return ctx.body = {err: 'projId is required'};
  
  const currProjConfig = db.get(`projects.${projId}`).value();
  const currAssetConfig = db.get(`assets.${assetId}`).value();

  const assetConfig = {
    username,
    project: currProjConfig,
    asset: currAssetConfig,
  };

  if(username && currProjConfig && (currProjConfig.founder === username || currProjConfig.collaborators[username]) || superPowerChecker(username)) {
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

const releaseAsset = async ({ project, asset }) => {
  const zipFilePath = path.join(zipAssetsStorePath, wrapAssetFileName(asset.id, 'releaseAsset'));
  const outputPath = project._deployPath || getDeployPath(project.projCode);

  return await unzipFile(zipFilePath, outputPath);
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

const writeReleaseNote = (ctx) => {
  const { project, asset } = ctx.assetConfig;
  const {
    username, projId, assetId,
  } = ctx.request.body;

  const releaseLog = {
    operator: username,
    version: asset.version,
    note: asset.desc,
    type: 'release'
  };

  project.releaseRef = assetId;
  db.set(`projects.${projId}`, project).write();
  db.set(`assets.${asset.id}.isReleased`, true).write();

  audit(projId, releaseLog);
};

const execWebHook = () => {
  console.log('TODO: 完善通知机制');
};

const handleSCP = async (ctx, next) => {
  const { isExecScp, username } = ctx.request.body;
  if(!isExecScp) return next();

  const { project, asset } = ctx.assetConfig;
  
  let { projCode, scpSourceDir = '', scpTargetHost, scpTargetDir, pushMode = 'push-files', host } = project;
  // let targetPath = path.join(scpTargetDir, projCode);
  // 不再使用 scp path + projCode 这样的组合
  let targetPath = path.join(scpTargetDir);
  let scpCommand = '';

  switch (pushMode) {
  // 把资源压缩包推送到目标服务器再解压
  case 'push-zip':
    let zipFileName = wrapAssetFileName(asset.id, 'handleSCP');
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

  return new Promise((resolve) => {
    // console.log(4)
    exec(scpCommand, (err) => {
      next();
      scpNotifyConfig({
        project: project.projName,
        host,
        desc: !err ? asset.desc: err,
        date: Date.now(),
        operator: username
      });
    });
  });
  // return next();
};

/**
 * release specified asset of specified project
 */
const handleRelease = async (ctx, next) => {
  const { project, asset } = ctx.assetConfig;
  const releaseRes = await releaseAsset({ project, asset });

  next();

  if(!releaseRes) {
    return ctx.body = {
      err: 'File not exist.'
    };
  }
  writeReleaseNote(ctx);
  const { isCallHook } = ctx.request.body;

  if(isCallHook) {
    execWebHook(ctx);
  }

  ctx.body = {
    err: ctx.scpRes
  };
  // await next();

  // if(isExecScp) {
  //   const scpRes = await handleSCP(ctx);
  //   console.log(scpRes);
  //   ctx.body = {
  //     err: ''
  //   };
  // } else {
  //   ctx.body = {
  //     err: null
  //   };
  // }

};

const releaseDone = async (ctx, next) => {
  await next();
  ctx.body = {
    err: ctx.scpErr
  };
};

/**
 * rollback
 */
const handleRollback = async (ctx, next) => {
  const { project, asset } = ctx.assetConfig;
  const releaseRes = await releaseAsset({ project, asset });

  if(!releaseRes) return ctx.body = {
    err: 'File not exist.'
  };

  const { username, projId, assetId, rollbackMark, prevAssetId } = ctx.request.body;
  const prevAssetConfig = Object.assign({}, db.get(`assets.${prevAssetId}`).value(), {
    isReleased: false,
    isRollback: true,
    rollbackMark,
    status: 'rollback'
  });
  const nextAssetConfig = Object.assign({}, asset, {
    isReleased: true,
    status: 'released'
  });

  project.releaseRef = assetId;
  db.set(`projects.${projId}`, project).write();
  db.set(`assets.${asset.id}`, nextAssetConfig).write();
  db.set(`assets.${prevAssetId}`, prevAssetConfig).write();

  ctx.body = {
    err: null
  };

  let releaseLog = {
    operator: username,
    version: asset.version,
    note: asset.desc,
    type: 'rollback'
  };
  audit(projId, releaseLog);
  
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
        fs.unlink(path.join(zipAssetsStorePath, wrapAssetFileName(assetId, 'removeAllAssets')), (err) => {
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
    const allAsset = db.get("assets").value();
    const currAssetForProject = findAll(allAsset, {belongto: project.id});
    const assets = [].concat(objToArr(currAssetForProject, null, 0));
    const delAsset = assets.slice(maxAssetCount);

    delAsset.forEach(item => {
      const assetId = item.id;
      const unlinkFilePath = path.join(zipAssetsStorePath, wrapAssetFileName(assetId, 'clearAsset'));
      fs.unlink(unlinkFilePath, (err) => {
        if(err) return reject(err);
        const releaseLog = {
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
  const { founder, projId } = ctx.request.body;

  let targetProject = db.get(`projects.${projId}`).value();
  let { assetNumb } = targetProject;

  let err = null;
  let nextAssetState = {};

  if(targetProject.founder == founder || !!targetProject.collaborators[founder]) {
    let currVersion = (+assetNumb || 0) + 1;
    let assetId = ctx.assetId;
    nextAssetState = {
      ...entityMerge({
        ...ctx.request.body
      }, assetEntity),
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
  } else {
    err = 'You have no promission to update this project';
  }
  ctx.body = {
    err: err,
    data: nextAssetState
  };
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
  let unlinkFilePath = path.join(zipAssetsStorePath, wrapAssetFileName(assetId, 'delAsset'));
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
  const fileName = wrapAssetFileName(assetId, 'downloadAsset');
  const zipFile = path.join(zipAssetsStorePath, fileName);

  ctx.set({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': 'attachment; filename=' + fileName
  });

  ctx.body = fs.createReadStream(zipFile);
};

const getSSHConfig = async (ctx) => {
  const list = deployConfigdb.get('deployConfig').value();
  let hostMapper = getSSHHostList();
  let resList = objToArr(list, null, 0);
  ctx.body = {
    err: null,
    data: resList
  };
};

const addSSHConfig = async (ctx) => {
  const { sshHost, desc, deployPath } = ctx.request.body;

  const createID = uuidv3(sshHost + desc + deployPath, uuidv3.DNS);
  
  let newConfig = entityMerge(ctx.request.body, deployConfigEntity);
  Object.assign(newConfig, {
    id: createID,
    createdDate: Date.now(),
  });
  
  deployConfigdb.set(`deployConfig.${createID}`, newConfig).write();

  ctx.body = {
    err: null,
    data: []
  };
};

const updateSSHConfig = async (ctx) => {
  const { sshHost, desc, deployPath, id } = ctx.request.body;

  if(id) {
    let newConfig = {
      sshHost, desc, deployPath
    };
    
    deployConfigdb.set(`deployConfig.${id}`, newConfig).write();
  }

  ctx.body = {
    err: id ? null : 'need id',
    data: []
  };
};

const delSSHConfig = async (ctx) => {
  const { id } = ctx.request.body;

  if(id) {
    deployConfigdb.unset(`deployConfig.${id}`).write();
  }

  ctx.body = {
    err: id ? null : 'need id',
  };
};

deploymentRouter.put('/project', checkProjAuth, updateProject);
deploymentRouter.put('/ssh-config', updateSSHConfig);
deploymentRouter.patch('/project', checkProjAuth, updateProject);

deploymentRouter.post('/release', checkProjAuth, handleRelease, handleSCP);
deploymentRouter.post('/rollback', checkProjAuth, handleRollback);
deploymentRouter.post('/del-asset', checkProjAuth, delAsset);
deploymentRouter.post('/join', applyToJoin);
deploymentRouter.post('/project', createProject);
deploymentRouter.post('/approve', checkProjAuth, approveJoinToProject);
deploymentRouter.post('/ssh-config', addSSHConfig);

deploymentRouter.del('/project', checkProjAuth, deleteProject);
deploymentRouter.del('/assets', checkProjAuth, delAsset);
deploymentRouter.del('/ssh-config', delSSHConfig);

deploymentRouter.get('/download-asset', downloadAsset);
deploymentRouter.get('/assets', getAssets);
deploymentRouter.get('/audit', getAutid);
deploymentRouter.get('/ssh-host', getSshHosts);
deploymentRouter.get('/project', getProjectList);
deploymentRouter.get('/ssh-config', getSSHConfig);

assetUploadRouter.post('/upload',
  // uploader.single('assetZip'),
  bodyParser({
    multipart: true,
    formidable: {
      uploadDir: zipAssetsStorePath,
      hash: 'sha1',
      keepExtensions: true
    }
  }),
  uploader,
  handleUpload
);

module.exports = {
  deploymentRouter,
  assetUploadRouter,
};
