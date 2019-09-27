import errorHandler from "errorhandler";

import app from "./app";
import { Port } from "./configs/site";

/**
 * Error Handler. Provides full stack - remove for production
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
const server = app.listen(Port, () => {
  console.log(
    "  App is running at http://localhost:%d in %s mode",
    Port,
    app.get("env")
  );
  console.log("  Press CTRL-C to stop\n");
});

export default server;
