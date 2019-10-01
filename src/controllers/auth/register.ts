import { Request, Response } from "express";
import { getManager } from "typeorm";

import { Users } from "../../entity/users";
import pwHelper from "../../utils/pw-helper";

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const userRepository = getManager().getRepository(Users);
  const user = await userRepository.findOne({ username });
  if(user) {
    return res.json({
      err: true,
      message: "用户已存在"
    });
  }
  const newUser = new Users();
  const createAt = new Date();
  // const newUser = userRepository.create(req.body);
  newUser.username = username;
  newUser.createAt = createAt;
  newUser.password = await pwHelper(password, createAt);
  userRepository.save(newUser);

  res.json({
    err: false,
    message: "注册成功"
  });
};