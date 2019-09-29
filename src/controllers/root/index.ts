import { Request, Response } from "express";
export const index = (req: Request, res: Response) => {
  res.json({
    err: false,
    data: "12"
  });
};
