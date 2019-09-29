import { Request, Response } from "express";
import { queryUser, addUser } from "../../models/users";
/**
 * 处理注册流程
 */
export const register = (req: Request, res: Response) => {
  const { username, password } = req.body;
  queryUser(username).then((result) => {

  });
  res.json({
    err: false
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
