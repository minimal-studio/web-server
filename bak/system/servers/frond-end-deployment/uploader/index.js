const multer = require('multer');
const uuidv1 = require('uuid/v1');

const uploadHelper = (zipAssetsStorePath) => {
  const fileStorageConfig = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, zipAssetsStorePath);
    },
    filename: (req, file, cb) => {
      let filename = uuidv1() + '.zip';
      cb(null, filename);
    }
  });
  return multer({storage: fileStorageConfig});
}

module.exports = uploadHelper;