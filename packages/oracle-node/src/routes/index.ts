import express from "express";
import { NodeConfig } from "../types";
import setCustomUrlRequestsRoute from "./custom-url-requests.route";
import setHomeRoute from "./home.route";
import { setLensReactionRoute } from "./lens";
import { setScoreByAddressRoute } from "./score-by-address";

export function setExpressRoutes(
  app: express.Application,
  nodeConfig: NodeConfig
) {
  setCustomUrlRequestsRoute(app, nodeConfig);
  setHomeRoute(app);
  setScoreByAddressRoute(app, nodeConfig);
  setLensReactionRoute(app, nodeConfig);
}
