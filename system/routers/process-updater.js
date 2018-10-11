let express = require('express');
let { exec } = require('child_process');
let updaterRouter = express.Router();

let updater = (req, res) => {
  console.log(req);
  exec('npm run restartServer', (err) => {
    let msg = err ? err : 'ok.';
    res.send(msg);
  });
};

updaterRouter.get('/__restart_anhao__', updater);

module.exports = updaterRouter;