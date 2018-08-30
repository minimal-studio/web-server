const express = require('express');
const fse = require('fs-extra');
const bodyParser = require('body-parser')
const uuidv3 = require('uuid/v3');

const config = require('./config');

let deploymentRouter = express.Router();

const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });

const { db, storePath, getAssetsPath } = config;

try {
  fse.ensureFileSync(storePath);
} catch(e) {
  fse.writeJsonSync(storePath, {});
}

deploymentRouter.get('/project/:user', (req, res) => {
  if(!req.params.user) res.json({err: true, desc: 'must pass username'});
  let projects = db.get('projects');
  res.json(config.wrapRes([projects]));
});

deploymentRouter.post('/project', jsonParser, (req, res) => {
  const { username, projName } = req.body;
  const createProjId = uuidv3(projName + username, uuidv3.DNS);
  const { deployStorePath, zipStorePath } = getAssetsPath(createProjId);

  let newProj = {
    id: createProjId,
    projName,
    founder: username,
    collaborators: {},
    storePath: zipStorePath,
    deployPath: deployStorePath,
  };
  
  db.set(`projects.${createProjId}`, newProj).write();
  // console.log(db.get('projects').find({id: createProjId}).value())

  res.json({
    err: false,
    projId: createProjId
  });
});

deploymentRouter.put('/project/:id', (req, res) => {
  res.send('put project')
});

deploymentRouter.delete('/project/:id', (req, res) => {
  res.send('delete project')
});

module.exports = deploymentRouter;
