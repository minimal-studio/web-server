import { Request, Response } from "express";
import { ApiResponse } from "./types/api-response";
import { CodeCN } from "./res-code-mapper";

export interface ResHandlerRes extends Response {
  locals: {
    handledResult: ApiResponse;
  };
}

export const resHandler = (req: Request, res: ResHandlerRes) => {
  const { code, data } = res.locals.handledResult;
  const resData = {
    code,
    message: CodeCN[`${code}`],
    data
  };
  res.json(resData);
};
