import { Request, Response } from "express";
import { getManager } from "typeorm";
import { Users } from "../../entity/users";
// import { queryUser, addUser } from "../../entity/users";
/**
 * 处理注册流程
 */
export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const userRepository = getManager().getRepository(Users);
  const user = await userRepository.findOne({ account: username });
  if(user) {
    return res.json({
      err: true,
      message: "用户已存在"
    });
  }
  const newUser = userRepository.create(req.body);
  userRepository.save(newUser);

  res.json({
    err: false,
    message: "注册成功"
  });
};

export const login = (req: Request, res: Response) => {
  const { username } = req.body;
  console.log(username);
  res.json({
    err: false,
    username
  });
};
