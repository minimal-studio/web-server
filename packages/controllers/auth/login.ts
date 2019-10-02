import { Request, Response, NextFunction } from "express";
import { getManager } from "typeorm";
import bcrypt from "bcrypt";

import { Users } from "@nws/entities/users";
import pwHelper, { connectPW } from "@nws/utils/pw-helper";

export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body;
  const userRepository = getManager().getRepository(Users);
  const user = await userRepository.findOne({ username });
  if(user) {
    const _pw = connectPW(password, user.createAt);
    bcrypt.compare(_pw, user.password, (err, isMatch) => {
      if(!err && isMatch) {
        res.locals.handledResult = {
          code: 0
        };
        next();
      } else {
        res.locals.handledResult = {
          code: 1001
        };
        next();
      }
    });
  } else {
    res.locals.handledResult = {
      code: 1001
    };
    next();
  }
};
