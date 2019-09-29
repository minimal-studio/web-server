import express from "express";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";

import Controller from "./controllers";

// import let dynamicRoute from ('../routers/dynami-router';
// import { mainServerPort, systemDir } from "./config";
// import publicRouter from "./routers/public-assets";
// import let processUpdater from ('../routers/proces-updater';
// import handleError from "./routers/erro-handle";

const app = express();

// const serversDir = "servers";

app.use(helmet());
app.use(compression());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(Controller);

// let accessLogStream = fs.createWriteStream(path.join(process.cwd(), "/runtime/web-server.log"), {flags: "a"});
// app.use(morgan("combined", {stream: accessLogStream}));

// let pathInfos = fs.readdirSync(path.join(__dirname, serversDir));
// let ignoreFirld = ["index.js", "config"];
// pathInfos.filter(dirname => ignoreFirld.indexOf(dirname) === -1).forEach((dirname) => {
//   let currServer = require("./" + path.join(serversDir, dirname));
//   let serverPath = currServer.alias || dirname;
//   let startSubServer = currServer.start;
//   let isForRootRouter = currServer.isForRootRouter;
//   if(startSubServer) {
//     try {
//       startSubServer();
//     } catch(e) {
//       console.log(e);
//     }
//   } else if(isForRootRouter) {
//     app.use(currServer);
//   } else {
//     app.use(`/${serverPath}`, currServer);
//   }
// });

// app.use('/sub', webServerApp);
// app.get('/', function (req, res) {
//   res.send("This is the '/' route in main_app");
// });

// app.use(dynamicRoute);

// app.use(publicRouter);

// app.use(processUpdater);

// 最后处理所有错误
// app.use((req, res, next) => {
//   res.status(404).send("non");
// });

// app.listen(mainServerPort, (err) => {
//   if(err) return console.log(err);
//   console.log("main server started at port " + mainServerPort);
// });

export default app;
