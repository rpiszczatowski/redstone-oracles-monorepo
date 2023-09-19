import { RedstoneTypes, SafeNumber } from "@redstone-finance/utils";

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
  [symbol: string]: TokenConfig | undefined;
}

export interface SourceTimeout {
  default: number;
  source: { [symbol: string]: number };
}

export interface TokenConfig {
  source?: string[] | undefined;
  deviationCheck?: DeviationCheckConfig;
  customUrlDetails?: CustomUrlDetails;
  comment?: string;
  skipSigning?: boolean;
  priceAggregator?: string;
  decimals?: number;
  fixedValue?: number;
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
  PriceDataBeforeAggregation<SafeNumber.ISafeNumber>;

export type NotSanitizedPriceDataBeforeAggregation =
  PriceDataBeforeAggregation<PriceDataFetchedValue>;

export interface Aggregator {
  getAggregatedValue: (
    price: SanitizedPriceDataBeforeAggregation,
    allPrices?: NotSanitizedPriceDataBeforeAggregation[]
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
  [symbol: string]: PriceDataFetchedValue;
}

export interface PricesObjWithMetadata {
  [symbol: string]: {
    value: PriceDataFetchedValue;
    metadata?: RedstoneTypes.MetadataPerSource;
  };
}

export interface PriceDataFetched {
  symbol: string;
  value: PriceDataFetchedValue; // usually it is a positive number, but it may also be 0, null, undefined or "error"
  metadata?: RedstoneTypes.MetadataPerSource;
}

export type PriceDataFetchedValue = number | string | null | undefined;

interface PriceDataBeforeAggregation<T> {
  id: string;
  symbol: string;
  source: PriceSource<T>;
  sourceMetadata: Record<string, RedstoneTypes.MetadataPerSource | undefined>;
  timestamp: number;
  blockNumber?: number;
  version: string;
}

export interface PriceSource<T> {
  [sourceName: string]: T;
}

interface PriceDataWithAggregate<V>
  extends SanitizedPriceDataBeforeAggregation {
  value: V;
}
export interface PriceDataAfterAggregation
  extends PriceDataWithAggregate<SafeNumber.ISafeNumber> {}

export interface PriceDataBeforeSigning extends PriceDataWithAggregate<number> {
  permawebTx: string;
  provider: string;
}

export interface PriceDataSigned extends PriceDataBeforeSigning {
  evmSignature?: string;
  liteEvmSignature?: string;
}

export interface ShortSinglePrice {
  symbol: string;
  value: number;
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
  values: number[];
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
  levelDbLocation: string;
  etherscanApiUrl?: string;
  etherscanApiKey?: string;
  ttlForPricesInLocalDBInMilliseconds: number;
  ethMainRpcUrls: string[];
  avalancheRpcUrls: string[];
  arbitrumRpcUrls: string[];
  optimismRpcUrls: string[];
  enableStreamrBroadcasting: boolean;
  mockPricesUrlOrPath: string;
  twelveDataApiKey?: string;
  coinmarketcapApiUrl: string;
  coinmarketcapApiKey?: string;
  kaikoApiKey?: string;
  stlouisfedApiKey?: string;
  minDataFeedsPercentageForBigPackage: number;
  providerIdForPriceBroadcasting?: string;
  coingeckoApiUrl: string;
  coingeckoApiKey?: string;
  enableHttpServer: boolean;
  pricesHardLimitsUrls: string[];
  newyorkfedRatesUrl: string;
  simulationValueInUsdForSlippageCheck: string;
  maxAllowedSlippagePercent: number;
  historicalDataPackagesUrl: string;
  telemetryUrl: string;
  telemetryAuthorizationToken: string;
}

export interface MulticallRequest {
  address: string;
  data: string;
  name: string;
}

// If value is undefined it means that request failed
export type MulticallParsedResponses = {
  [address in string]?: {
    [functionName in string]?: string;
  }[];
};
