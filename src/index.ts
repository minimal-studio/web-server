import "reflect-metadata";
import { createConnection, Connection } from "typeorm";

import errorHandler from "errorhandler";

import app from "./app";
import { Port } from "./configs/site";

createConnection().then((connection: Connection) => {
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
});
