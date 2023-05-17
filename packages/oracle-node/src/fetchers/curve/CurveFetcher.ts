import { BigNumber, Contract, providers, utils } from "ethers";
import { getLastPrice } from "../../db/local-db";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import { PoolsConfig } from "./curve-fetchers-config";
import abi from "./CurveFactory.abi.json";
import { appendFileSync } from "fs";

const DEFAULT_DECIMALS = 8;
const DEFAULT_RATIO_QUANTITY = 10 ** DEFAULT_DECIMALS;

export interface CurveFetcherResponse {
  ratio: BigNumber;
  assetId: string;
}

export class CurveFetcher extends DexOnChainFetcher<CurveFetcherResponse> {
  protected retryForInvalidResponse: boolean = true;

  constructor(name: string, public readonly poolsConfig: PoolsConfig) {
    super(name);
  }

  async makeRequest(
    id: string,
    blockTag?: string | number
  ): Promise<CurveFetcherResponse> {
    const { address, provider, ratioMultiplier, functionName } =
      this.poolsConfig[id];
    const curveFactory = new Contract(address, abi, provider);

    const { tokenIndex, pairedTokenIndex } = this.poolsConfig[id];

    const ratio = await curveFactory[functionName](
      tokenIndex,
      pairedTokenIndex,
      (DEFAULT_RATIO_QUANTITY * ratioMultiplier).toString(),
      { blockTag }
    );

    if (!blockTag) {
      appendFileSync(
        "curverFetcher.log",
        `${id} ${new Date().toUTCString()} ${ratio} \n`
      );
    }

    return {
      ratio,
      assetId: id,
    };
  }

  override calculateSpotPrice(
    assetId: string,
    response: CurveFetcherResponse
  ): number {
    const pairedTokenPrice = this.getPairedTokenPrice(assetId);
    const { ratio } = response;
    const ratioAsNumber = Number(utils.formatUnits(ratio, DEFAULT_DECIMALS));
    return ratioAsNumber * pairedTokenPrice;
  }

  calculateLiquidity(
    _assetId: string,
    _response: CurveFetcherResponse
  ): number {
    return 0;
  }

  getPairedTokenPrice(assetId: string) {
    const { pairedToken } = this.poolsConfig[assetId];

    const lastPriceFromCache = getLastPrice(pairedToken);
    if (!lastPriceFromCache) {
      throw new Error(`Cannot get last price from cache for: ${pairedToken}`);
    }
    return lastPriceFromCache.value;
  }
}
