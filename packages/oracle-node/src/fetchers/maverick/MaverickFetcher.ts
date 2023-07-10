import Decimal from "decimal.js";
import { Contract, providers } from "ethers";
import { getRawPrice } from "../../db/local-db";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import fetcherConfig from "./maverick-fetcher-config";
import { MAVERICK_POOL_INFORMATION_ABI } from "./pool-information.abi";

const MAVERICK_PRECISION_DIVIDER = 1e18;
const ONE_AS_DECIMAL = new Decimal(1);

interface FetcherConfig {
  poolInformationAddress: string;
  provider: providers.Provider;
  tokens: {
    [dataFeedId: string]: TokenConfig;
  };
}
interface TokenConfig {
  token0Symbol: string;
  token1Symbol: string;
  pairedToken: string;
  poolAddress: string;
}
type SupportedIds = keyof (typeof fetcherConfig)["tokens"];

export interface MaverickResponse {
  priceInPairedToken: Decimal;
  pairedTokenPrice: Decimal;
}

export class MaverickFetcher extends DexOnChainFetcher<MaverickResponse> {
  constructor(private readonly config: FetcherConfig = fetcherConfig) {
    super(MaverickFetcher.name);
  }

  override async makeRequest(id: string): Promise<MaverickResponse> {
    const { pairedToken, poolAddress } = this.config.tokens[id as SupportedIds];
    const pairedTokenPrice = this.getPairedTokenPrice(pairedToken);

    const contract = new Contract(
      this.config.poolInformationAddress,
      MAVERICK_POOL_INFORMATION_ABI,
      this.config.provider
    );

    const sqrtPrice = await contract.getSqrtPrice(poolAddress);
    const priceInPairedToken = new Decimal(sqrtPrice.toString())
      .div(MAVERICK_PRECISION_DIVIDER)
      .toPower(2);

    return { priceInPairedToken, pairedTokenPrice };
  }

  override calculateSpotPrice(
    dataFeedId: string,
    response: MaverickResponse
  ): number {
    const { priceInPairedToken, pairedTokenPrice } = response;

    const isCurrentDataFeedToken0 =
      this.config.tokens[dataFeedId].token0Symbol === dataFeedId;

    let priceInPairedTokenSerialized = priceInPairedToken;
    if (!isCurrentDataFeedToken0) {
      priceInPairedTokenSerialized = ONE_AS_DECIMAL.div(
        priceInPairedTokenSerialized
      );
    }

    return priceInPairedTokenSerialized.mul(pairedTokenPrice).toNumber();
  }

  protected getPairedTokenPrice(tokenSymbol: string): Decimal {
    const lastPriceFromCache = getRawPrice(tokenSymbol);
    if (!lastPriceFromCache) {
      throw new Error(`Cannot get last price from cache for: ${tokenSymbol}`);
    }
    return new Decimal(lastPriceFromCache.value);
  }
}
