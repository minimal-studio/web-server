/**
 * Encrypt pw
 * 根据系统实际情况定义
 * TODO: 抽离成为插件形式插入到系统中
 */
import bcrypt from "bcrypt";

export const connectPW = (srcPW: string, createAt: Date) => {
  return srcPW + String(createAt);
};

const pwHelper = (srcPW: string, createAt: Date, saltRounds = 10) => {
  return new Promise<string>((resolve, reject) => {
    const resPW = connectPW(srcPW, createAt);
    bcrypt.hash(resPW, saltRounds, (err, hash) => {
      if(err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });
};

export default pwHelper;