import path from "path";
import { getManager } from "typeorm";
import { Request, Response } from "express";

import { Users } from "../../entity/users";

export const index = async (req: Request, res: Response) => {
  // res.sendFile(path.resolve(process.cwd(), "./view/test-login.html"));
  const userRepository = getManager().getRepository(Users);
  const users = await userRepository.find();
  res.json({
    data: users
  });
};
