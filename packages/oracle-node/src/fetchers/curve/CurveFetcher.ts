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
    symbol0: string;
    symbol1: string;
    pairedToken: string;
    provider: providers.Provider;
    ratioMultiplier: number;
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
    const { address, provider, ratioMultiplier } = this.poolsConfig[id];
    const curveFactory = new Contract(address, abi as any, provider);

    const { symbol0 } = this.poolsConfig[id];
    const isSymbol0CurrentAsset = symbol0 === id;
    const requestParams = {
      param0: isSymbol0CurrentAsset ? 0 : 1,
      param1: isSymbol0CurrentAsset ? 1 : 0,
    };

    const ratio = await curveFactory.get_dy(
      requestParams.param0,
      requestParams.param1,
      (DEFAULT_RATIO_QUANTITY * ratioMultiplier).toString()
    );

    return {
      ratio,
      assetId: id,
    };
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

    const spotPrice = ratio.mul(utils.parseEther("1.0")).div(pairedTokenPrice);

    return parseFloat(utils.formatUnits(spotPrice, DEFAULT_DECIMALS));
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
    const pairedTokenPriceAsBigNumber = utils.parseEther(
      lastPriceFromCache.value.toString()
    );

    return pairedTokenPriceAsBigNumber;
  }
}
