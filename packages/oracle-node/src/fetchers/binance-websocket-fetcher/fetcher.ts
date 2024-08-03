import { BinancePriceWebSocketFetcher } from "./BinancePriceWebSocketFetcher";
import { config } from "../../config";

const fetcherConfig = {
  wsClientOptions: {
    url: config.binanceWsUrl,
  },
  pendingResponseTimoutMs: 1000,
};

export const binanceWebSocketFetcher = new BinancePriceWebSocketFetcher(
  fetcherConfig.wsClientOptions,
  fetcherConfig.pendingResponseTimoutMs
);
