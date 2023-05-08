import { BigNumber, providers, Contract } from "ethers";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import { getLastPrice } from "../../db/local-db";
import abi from "./CurveFactory.abi.json";

const CURVE_PRECISION_RATIO = 10 ** 18;

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
  ratio: number;
  assetId: string;
}

export class CurveFetcher extends DexOnChainFetcher<Response> {
  protected retryForInvalidResponse: boolean = true;

  constructor(name: string, private readonly poolsConfig: PoolsConfig) {
    super(name);
  }

  async makeRequest(assetId: string): Promise<Response> {
    const {
      address,
      provider,
      ratioMultiplier,
      functionName,
      tokenIndex,
      pairedTokenIndex,
    } = this.poolsConfig[assetId];

    const curveFactory = new Contract(address, abi, provider);

    const ratio = (await curveFactory[functionName](
      tokenIndex,
      pairedTokenIndex,
      // as default value we should use 10 ** 18 this the PRECISION on Curve StableSwap contract
      // if we provide value lower then 10 ** 18 we start loosing PRECISION
      // if we provide value bigger then 10 ** 18  for example 100 * 10**18 we are saying how much pairedTokenIndex i wil receive for tokenIndex
      // thus there is higher chance that slippage will occur and will affect price
      // same in examples https://curve.readthedocs.io/factory-pools.html#StableSwap.get_dy and on Curve frontend
      // in case of LPs (with big volume) it shouldn't be a problem, however this just not correct
      CURVE_PRECISION_RATIO.toString()
    )) as BigNumber;

    return {
      ratio:
        Number(ratio.toString()) / (CURVE_PRECISION_RATIO / ratioMultiplier),
      assetId,
    };
  }

  calculateSpotPrice(assetId: string, response: Response): number {
    const pairedTokenPrice = this.getPairedTokenPrice(assetId);
    const { ratio } = response;
    return ratio * pairedTokenPrice;
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
