import { Router } from "express";
import * as rootController from "./root";
import * as authController from "./auth";
import { resHandler } from "@nws/res-handler";

const ControllerRouter = Router();

ControllerRouter.get("/", rootController.index);
ControllerRouter.post("/login", authController.login);
ControllerRouter.post("/register", authController.register);

/** 统一处理返回接口 */
ControllerRouter.use(resHandler);

export default ControllerRouter;
