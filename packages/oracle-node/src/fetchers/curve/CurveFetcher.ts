import { BigNumber, providers, utils, Contract } from "ethers";
import {
  DexOnChainFetcher,
  Responses,
} from "../dex-on-chain/DexOnChainFetcher";
import { getLastPrice } from "../../db/local-db";
import abi from "./CurveFactory.abi.json";

const DEFAULT_DECIMALS = 8;
const DEFAULT_RATIO_QUANTITY = 10 ** DEFAULT_DECIMALS;

export interface PoolsConfig {
  [symbol: string]: {
    address: string;
    tokenIndex: number;
    pairedToken: string;
    pairedTokenIndex: number;
    provider: providers.Provider;
    ratioMultiplier: number;
    functionName: string;
  };
}

interface Response {
  ratio: BigNumber;
  assetId: string;
}

export class CurveFetcher extends DexOnChainFetcher<Response> {
  protected retryForInvalidResponse: boolean = true;

  constructor(name: string, private readonly poolsConfig: PoolsConfig) {
    super(name);
  }

  async makeRequest(id: string): Promise<Response> {
    try {
      const { address, provider, ratioMultiplier, functionName } =
        this.poolsConfig[id];
      const curveFactory = new Contract(address, abi, provider);

      const { tokenIndex, pairedTokenIndex } = this.poolsConfig[id];

      const ratio = await curveFactory[functionName](
        tokenIndex,
        pairedTokenIndex,
        (DEFAULT_RATIO_QUANTITY * ratioMultiplier).toString()
      );

      return {
        ratio,
        assetId: id,
      };
    } catch (error) {
      throw error;
    }
  }

  getAssetId(response: Response) {
    return response.assetId;
  }

  validateResponse(response: Responses<Response>): boolean {
    return response !== undefined;
  }

  calculateSpotPrice(assetId: string, response: Response): number {
    const pairedTokenPrice = this.getPairedTokenPrice(assetId);
    const { ratio } = response;
    const ratioAsNumber = Number(utils.formatUnits(ratio, DEFAULT_DECIMALS));
    return ratioAsNumber * pairedTokenPrice;
  }

  calculateLiquidity(_assetId: string, _response: Response): number {
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
