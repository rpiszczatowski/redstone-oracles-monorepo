import { NumericDataPoint } from "redstone-protocol";
import { Manifest } from "../../src/types";

export const mockDataPoints = [
  { dataFeedId: "BTC", value: 20000 },
  { dataFeedId: "ETH", value: 1600 },
  { dataFeedId: "AR", value: 8 },
  { dataFeedId: "AVAX", value: 16 },
].map((dpArgs) => new NumericDataPoint(dpArgs));

export const mockManifest = {
  tokens: {
    BTC: {},
    ETH: {},
    AR: {},
    AVAX: {},
  },
} as unknown as Manifest;
