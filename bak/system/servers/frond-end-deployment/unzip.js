const unzip = require('unzip');
const fs = require('fs');

const unzipFile = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(inputPath)) {
      fs.createReadStream(inputPath)
        .pipe(unzip.Extract({ path: outputPath }));
      return resolve();
    } else {
      return reject();
    }
  });
}

module.exports = unzipFile;