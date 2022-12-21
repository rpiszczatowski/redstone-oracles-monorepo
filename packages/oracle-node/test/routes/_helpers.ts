import express from "express";
import setCustomUrlRequestsRoute from "../../src/routes/custom-url-requests.route";
import setHomeRoute from "../../src/routes/home.route";
import { setScoreByAddressRoute } from "../../src/routes/score-by-address";
import { setLensReactionRoute } from "../../src/routes/lens";
import { MOCK_NODE_CONFIG } from "../helpers";

export function getApp() {
  const app = express();
  setCustomUrlRequestsRoute(app, MOCK_NODE_CONFIG);
  setHomeRoute(app);
  setScoreByAddressRoute(app, MOCK_NODE_CONFIG);
  setLensReactionRoute(app, MOCK_NODE_CONFIG)
  return app;
}
