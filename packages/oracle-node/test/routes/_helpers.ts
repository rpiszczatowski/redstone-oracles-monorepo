import express from "express";
import setCustomUrlRequestsRoute from "../../src/routes/custom-url-requests.route";
import setHomeRoute from "../../src/routes/home.route";
import { MOCK_NODE_CONFIG } from "../helpers";

export function getApp() {
  const app = express();
  setCustomUrlRequestsRoute(app, MOCK_NODE_CONFIG);
  setHomeRoute(app);
  return app;
}
