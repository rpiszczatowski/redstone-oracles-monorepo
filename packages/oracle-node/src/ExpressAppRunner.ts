import express from "express";
import cors from "cors";
import { setExpressRoutes } from "./routes/index";
import { NodeConfig } from "./types";
import loggerFactory from "./utils/logger";

const logger = loggerFactory("express");

const PORT = 8080;

// For now we run a very simple express app to allow running the
// redstone node in the AWS App runner.
// Read more at:

// This class will be extended in future and will be used for
// communication between nodes
export class ExpressAppRunner {
  constructor(private nodeConfig: NodeConfig) {}

  run() {
    if (process.env.NODE_ENV === "test" || !this.nodeConfig.enableHttpServer) {
      logger.info(`Http server is disabled`);
      return;
    }
    const app = express();
    app.use(cors());
    setExpressRoutes(app, this.nodeConfig);
    logger.info(`Running http server on port: ${PORT}`);
    app.listen(PORT, () => {
      logger.info(`Server started at http://localhost:${PORT}`);
    });
  }
}
