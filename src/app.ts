import express from "express";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";

import Controller from "@nws/controllers";

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(Controller);

export default app;
