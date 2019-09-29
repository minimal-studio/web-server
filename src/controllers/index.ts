import { Router } from "express";
import * as rootController from "./root";
import * as authController from "./auth";

const ControllerRouter = Router();

ControllerRouter.get("/", rootController.index);
ControllerRouter.post("/login", authController.login);
ControllerRouter.post("/register", authController.register);

export default ControllerRouter;
