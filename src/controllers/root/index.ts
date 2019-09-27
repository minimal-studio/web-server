import { Request, Response } from "express";
export const rootController = (req: Request, res: Response) => {
  res.json({
    err: false,
  });
};
