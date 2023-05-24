import { ISafeNumber } from "./numbers/ISafeNumber";

export interface Manifest {
  txId?: string; // Note, you need to set this field manually (after downloading the manifest data)
  interval: number; // It is ignored if the `useCustomScheduler` is not set to `interval`
  useCustomScheduler?: "on-each-arbitrum-block" | "interval";
  priceAggregator: string;
  defaultSource?: string[];
  sourceTimeout: number;
  deviationCheck: DeviationCheckConfig;
  tokens: TokensConfig;
  minValidSourcesPercentage?: number;
  signBlockNumbersInsteadOfTimestamps?: boolean;
}

export interface TokensConfig {
  [symbol: string]: TokenConfig;
}

export interface SourceTimeout {
  default: number;
  source: { [symbol: string]: number };
}

export interface TokenConfig {
  source?: string[];
  deviationCheck?: DeviationCheckConfig;
  customUrlDetails?: CustomUrlDetails;
  comment?: string;
  skipSigning?: boolean;
  priceAggregator?: string;
  decimals?: number;
}

export interface DeviationCheckConfig {
  deviationWithRecentValues: {
    maxPercent: number;
    maxDelayMilliseconds: number;
  };
}

export interface CustomUrlDetails {
  url: string;
  jsonpath: string;
}

export interface FetcherOpts {
  manifest: Manifest;
}

export interface Fetcher {
  fetchAll: (
    tokens: string[],
    opts?: FetcherOpts
  ) => Promise<PriceDataFetched[]>;
}

export type SanitizedPriceDataBeforeAggregation =
  PriceDataBeforeAggregation<ISafeNumber>;

export interface Aggregator {
  getAggregatedValue: (
    price: SanitizedPriceDataBeforeAggregation,
    allPrices?: PriceDataBeforeAggregation<number>[]
  ) => PriceDataAfterAggregation;
}

export interface Broadcaster {
  broadcast: (prices: PriceDataSigned[]) => Promise<void>;
  broadcastPricePackage: (
    pricePackage: SignedPricePackage,
    providerAddress: string
  ) => Promise<void>;
}

export interface PricesObj {
  [symbol: string]: number;
}

export interface PriceDataFetched {
  symbol: string;
  value: any; // usually it is a positive number, but it may also be 0, null, undefined or "error"
}

export interface PriceDataBeforeAggregation<T = number> {
  id: string;
  symbol: string;
  source: PriceSource<T>;
  timestamp: number;
  blockNumber?: number;
  version: string;
}

export interface PriceSource<T> {
  [sourceName: string]: T;
}

export interface PriceDataAfterAggregation
  extends SanitizedPriceDataBeforeAggregation {
  value: ISafeNumber;
}

export interface PriceDataBeforeSigning extends PriceDataAfterAggregation {
  permawebTx: string;
  provider: string;
}

export interface PriceDataSigned extends PriceDataBeforeSigning {
  evmSignature?: string;
  liteEvmSignature?: string;
}

export interface ShortSinglePrice {
  symbol: string;
  value: any;
}

export interface PricePackage {
  prices: ShortSinglePrice[];
  timestamp: number;
}

export interface SignedPricePackage {
  pricePackage: PricePackage;
  signerAddress: string;
  liteSignature: string;
}

export interface SerializedPriceData {
  symbols: string[];
  values: any[];
  timestamp: number;
}

export interface ArweaveTransactionTags {
  [tag: string]: string;
}

export interface PrivateKeys {
  ethereumPrivateKey: string;
}

export interface NodeConfig {
  enableJsonLogs: boolean;
  enablePerformanceTracking: boolean;
  printDiagnosticInfo: boolean;
  manifestRefreshInterval: number;
  privateKeys: PrivateKeys;
  overrideManifestUsingFile?: Manifest;
  ethereumAddress: string;
  overrideDirectCacheServiceUrls?: string[];
  overridePriceCacheServiceUrls?: string[];
  coinbaseIndexerMongoDbUrl?: string;
  ethMainRpcUrls: string[];
  levelDbLocation: string;
  etherscanApiUrl?: string;
  etherscanApiKey?: string;
  ttlForPricesInLocalDBInMilliseconds: number;
  avalancheRpcUrls: string[];
  arbitrumRpcUrls: string[];
  enableStreamrBroadcasting: boolean;
  mockPricesUrlOrPath: string;
  twelveDataApiKey?: string;
  coinmarketcapApiKey?: string;
  kaikoApiKey?: string;
  stlouisfedApiKey?: string;
  minDataFeedsPercentageForBigPackage: number;
  providerIdForPriceBroadcasting?: string;
  coingeckoApiUrl: string;
  coingeckoApiKey?: string;
  enableHttpServer: boolean;
  pricesHardLimitsUrl: string;
  newyorkfedRatesUrl: string;
}

export interface MulticallRequest {
  address: string;
  data: string;
  name: string;
}

// If value is undefined it means that request failed
export type MulticallParsedResponses = {
  [address in string]: {
    [functionName in string]?: string;
  };
};
