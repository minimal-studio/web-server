const unzip = require('unzip');
const fs = require('fs');

const unzipFile = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      fs.createReadStream(inputPath)
        .pipe(unzip.Extract({ path: outputPath }));
      resolve();
    } catch(e) {
      console.log(e)
      reject();
    }
  });
}

module.exports = unzipFile;