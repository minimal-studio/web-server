const unzip = require('unzip');
const fs = require('fs');

const unzipFile = async (inputPath, outputPath) => {
  if(!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }
  if(fs.existsSync(inputPath)) {
    try {
      fs.createReadStream(inputPath)
        .pipe(unzip.Extract({ path: outputPath }));
    } catch(e) {
      return e;
    }
  }
};

module.exports = unzipFile;