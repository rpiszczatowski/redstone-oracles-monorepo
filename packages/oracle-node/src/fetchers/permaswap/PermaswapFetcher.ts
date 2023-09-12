import axios from "axios";
import { getLastPrice } from "../../db/local-db";
import {
  MultiRequestFetcher,
  RequestIdToResponse,
} from "../MultiRequestFetcher";
import { pools } from "./permaswap-pools-config";

type PermaswapResponse = {
  currentPriceUp: string;
  currentPriceDown: string;
};

export type PermaswapPoolsConfig = {
  [symbol: string]: {
    poolAddress: string;
    pairedToken: string;
    direction: "currentPriceDown" | "currentPriceUp";
  };
};

const PERMASWAP_ROUTER_URL = "https://router.permaswap.network/pool";

export class PermaswapFetcher extends MultiRequestFetcher {
  protected override retryForInvalidResponse: boolean = true;

  constructor() {
    super("permaswap");
  }

  override async makeRequest(requestId: string): Promise<PermaswapResponse> {
    const { poolAddress } = this.getPool(requestId);
    const res = await axios.get<PermaswapResponse>(
      `${PERMASWAP_ROUTER_URL}/${poolAddress}`
    );
    return res.data;
  }

  override extractPrice(
    dataFeedId: string,
    responses: RequestIdToResponse
  ): number | undefined {
    const response: PermaswapResponse = responses[dataFeedId];
    if (response) {
      const { direction } = this.getPool(dataFeedId);
      const ratio = parseFloat(response[direction]);
      const pairedTokenPrice = this.getPairedTokenPrice(dataFeedId);
      return ratio * pairedTokenPrice;
    }
    return undefined;
  }

  getPool(requestId: string) {
    const pool = pools[requestId];
    if (!pool) {
      throw new Error(`${requestId} not found in ${this.name} fetcher`);
    }
    return pool;
  }

  protected getPairedTokenPrice(assetId: string): number {
    let { pairedToken } = this.getPool(assetId);

    const lastPriceFromCache = getLastPrice(pairedToken);
    if (!lastPriceFromCache) {
      throw new Error(`Cannot get last price from cache for: ${pairedToken}`);
    }

    return lastPriceFromCache.value;
  }
}
