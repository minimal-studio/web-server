const fs = require('fs');
const path = require('path');
const uuidv1 = require('uuid/v1');

const saveFile = (savePath) => {
  if(!savePath) console.log('请传入 savePath');
  return async (ctx, next) => {
    const file = ctx.request.files.assetZip;
    const ext = path.extname(file.name);
    const assetId = uuidv1();
    if(!file) return ctx.body = {
      err: 'no upload files'
    };
    const reader = fs.createReadStream(file.path);
    const stream = fs.createWriteStream(path.join(savePath, assetId + ext));
    reader.pipe(stream);
    ctx.assetId = assetId;
    await next();
    fs.unlink(file.path, (err) => {
      if(err) console.log(err);
    });
  };
};

module.exports = saveFile;