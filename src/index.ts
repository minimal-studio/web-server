import "reflect-metadata";
import { createConnection, Connection } from "typeorm";

import errorHandler from "errorhandler";

import app from "./app";
import { Port } from "@nws/configs/site";

createConnection().then(() => {
  /**
   * Error Handler. Provides full stack - remove for production
   */
  app.use(errorHandler());

  /**
   * Start Express server.
   */
  app.listen(Port, () => {
    console.log(
      "  App is running at http://localhost:%d in %s mode",
      Port,
      app.get("env")
    );
    console.log("  Press CTRL-C to stop\n");
  });
}).catch(error => console.log(error));
