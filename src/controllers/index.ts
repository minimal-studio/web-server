import { Router } from "express";
import { rootController } from "./root";

const ControllerRouter = Router();

ControllerRouter.get("/", rootController);

export default ControllerRouter;
