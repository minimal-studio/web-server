import { Request, Response } from "express";
import { getManager } from "typeorm";
import bcrypt from "bcrypt";

import { Users } from "../../entity/users";
import pwHelper, { connectPW } from "../../utils/pw-helper";

const handleLoginFail = (res: Response) => {
  res.json({
    err: true,
    message: "用户名或密码错误"
  });
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const userRepository = getManager().getRepository(Users);
  const user = await userRepository.findOne({ username });
  if(user) {
    const _pw = connectPW(password, user.createAt);
    bcrypt.compare(_pw, user.password, (err, result) => {
      // res == true
      if(result) {
        return res.json({
          err: false,
          message: "登陆成功"
        });
      } else {
        return handleLoginFail(res);
      }
    });
  } else {
    return handleLoginFail(res);
  }
};
