import { Consola } from "consola";
import { v4 as uuidv4 } from "uuid";
import { getPrices, PriceValueInLocalDB } from "../db/local-db";
import ManifestHelper, { TokensBySource } from "../manifest/ManifestHelper";
import { ISafeNumber } from "../numbers/ISafeNumber";
import { SafeNumber } from "../numbers/SafeNumberFactory";
import { IterationContext } from "../schedulers/IScheduler";
import { terminateWithManifestConfigError } from "../Terminator";
import {
  DeviationCheckConfig,
  Manifest,
  PriceDataAfterAggregation,
  PriceDataBeforeAggregation,
  PriceDataBeforeSigning,
  PriceDataFetched,
  SanitizedPriceDataBeforeAggregation,
} from "../types";
import { stringifyError } from "../utils/error-stringifier";
import {
  calculateAverageValue,
  calculateDeviationPercent,
} from "../utils/numbers";
import { trackEnd, trackStart } from "../utils/performance-tracker";
import { promiseTimeout } from "../utils/promise-timeout";
import fetchers from "./index";

const VALUE_FOR_FAILED_FETCHER = "error";

const logger = require("../utils/logger")("PricesFetcher") as Consola;

export type PricesDataFetched = { [source: string]: PriceDataFetched[] };
export type PricesBeforeAggregation = {
  [token: string]: PriceDataBeforeAggregation;
};

export interface PriceValidationArgs {
  value: ISafeNumber;
  timestamp: number;
  deviationConfig: DeviationCheckConfig;
  recentPrices: PriceValueInLocalDB[];
}

export default class PricesService {
  constructor(private manifest: Manifest) {}

  async fetchInParallel(
    tokensBySource: TokensBySource
  ): Promise<PricesDataFetched[]> {
    const promises: Promise<PricesDataFetched>[] = [];

    for (const source in tokensBySource) {
      promises.push(this.safeFetchFromSource(source, tokensBySource[source]));
    }

    return await Promise.all(promises);
  }

  private async safeFetchFromSource(
    source: string,
    tokens: string[]
  ): Promise<PricesDataFetched> {
    try {
      // Fetching
      const pricesFromSource = await this.doFetchFromSource(source, tokens);

      return {
        [source]: pricesFromSource,
      };
    } catch (e: any) {
      // We don't throw an error because we want to continue with
      // other fetchers even if some fetchers failed
      const resData = e.response ? e.response.data : "";

      // We use warn level instead of error because
      // price fetching errors occur quite often
      logger.warn(
        `Fetching failed for source: ${source}: ${resData}`,
        stringifyError(e)
      );
      return {
        [source]: tokens.map((symbol) => ({
          symbol,
          value: VALUE_FOR_FAILED_FETCHER,
        })),
      };
    }
  }

  async doFetchFromSource(
    source: string,
    tokens: string[]
  ): Promise<PriceDataFetched[]> {
    if (tokens.length === 0) {
      terminateWithManifestConfigError(
        `${source} fetcher received an empty array of symbols`
      );
    }

    if (!fetchers[source]) {
      terminateWithManifestConfigError(
        `Fetcher for source ${source} doesn't exist`
      );
    }

    const fetchPromise = () =>
      fetchers[source].fetchAll(tokens, {
        manifest: this.manifest,
      });

    const sourceTimeout = ManifestHelper.getTimeoutForSource(
      source,
      this.manifest
    );
    if (sourceTimeout === null) {
      terminateWithManifestConfigError(
        `No timeout configured for ${source}. Did you forget to add "sourceTimeout" field in manifest file?`
      );
    }
    logger.info(`Call to ${source} will timeout after ${sourceTimeout}ms`);

    const trackingId = trackStart(`fetching-${source}`);
    try {
      // Fail if there is no response after given timeout
      const prices = await promiseTimeout(() => fetchPromise(), sourceTimeout);
      logger.info(
        `Fetched prices in USD for ${prices.length} currencies from source: "${source}"`
      );

      return prices;
    } finally {
      trackEnd(trackingId);
    }
  }

  static groupPricesByToken(
    iterationContext: IterationContext,
    pricesData: PricesDataFetched,
    nodeVersion: string
  ): PricesBeforeAggregation {
    const result: PricesBeforeAggregation = {};

    for (const source in pricesData) {
      for (const price of pricesData[source]) {
        if (result[price.symbol] === undefined) {
          result[price.symbol] = {
            id: uuidv4(), // Generating unique id for each price
            source: {},
            symbol: price.symbol,
            timestamp: iterationContext.timestamp,
            blockNumber: iterationContext.blockNumber,
            version: nodeVersion,
          };
        }

        result[price.symbol].source[source] = price.value;
      }
    }

    return result;
  }

  /*
    This function calculates aggregated price values based on
      - recent deviations check
      - invalid values excluding
      - aggregation across different sources
      - valid sources number
  */
  async calculateAggregatedValues(
    prices: PriceDataBeforeAggregation[]
  ): Promise<PriceDataAfterAggregation[]> {
    const pricesInLocalDB = await getPrices(prices.map((p) => p.symbol));

    const aggregatedPrices: PriceDataAfterAggregation[] = [];
    for (const price of prices) {
      const deviationCheckConfig = this.deviationCheckConfig(price.symbol);
      const pricesInLocalDBForSymbol = pricesInLocalDB[price.symbol] || [];

      try {
        // Filtering out invalid (or too deviated) values from the `source` object
        const sanitizedPriceBeforeAggregation = this.sanitizeSourceValues(
          price,
          pricesInLocalDBForSymbol,
          deviationCheckConfig
        );

        const aggregator = ManifestHelper.getAggregatorForToken(
          this.manifest,
          price.symbol
        );

        // Calculating final aggregated value based on the values from the "valid" sources
        const priceAfterAggregation = aggregator.getAggregatedValue(
          sanitizedPriceBeforeAggregation,
          prices
        );

        // Throwing an error if price < 0 is invalid or too deviated
        priceAfterAggregation.value.assertNonNegative();
        this.assertStableDeviation({
          value: priceAfterAggregation.value,
          timestamp: priceAfterAggregation.timestamp,
          deviationConfig: deviationCheckConfig,
          recentPrices: pricesInLocalDBForSymbol,
        });

        // Throwing an error if not enough sources for symbol
        this.assertSourcesNumber(priceAfterAggregation, this.manifest);

        aggregatedPrices.push(priceAfterAggregation);
      } catch (e: any) {
        logger.error(`Symbol ${price.symbol}, ${e.stack}`);
      }
    }

    return aggregatedPrices;
  }

  /**
   * This function converts all source values to Redstone Numbers
   * and excludes sources with invalid values
   * */
  sanitizeSourceValues(
    price: PriceDataBeforeAggregation,
    recentPricesInLocalDBForSymbol: PriceValueInLocalDB[],
    deviationCheckConfig: DeviationCheckConfig
  ): SanitizedPriceDataBeforeAggregation {
    const newSources: { [symbol: string]: ISafeNumber } = {};

    for (const [sourceName, valueFromSource] of Object.entries(price.source)) {
      try {
        const valueFromSourceNum = SafeNumber(valueFromSource);

        valueFromSourceNum.assertNonNegative();

        this.assertStableDeviation({
          // clone value
          value: SafeNumber(valueFromSourceNum),
          timestamp: price.timestamp,
          deviationConfig: deviationCheckConfig,
          recentPrices: recentPricesInLocalDBForSymbol,
        });

        newSources[sourceName] = valueFromSourceNum;
      } catch (e: any) {
        logger.warn(
          `Excluding ${price.symbol} value ${valueFromSource} for source: ${sourceName}. Reason: ${e.message}`
        );
      }
    }

    return { ...price, source: newSources };
  }

  assertStableDeviation(args: PriceValidationArgs) {
    const { deviationConfig } = args;
    const { deviationWithRecentValues } = deviationConfig;

    const deviationPercent = this.getDeviationWithRecentValuesAverage(args);

    if (deviationPercent.gt(deviationWithRecentValues.maxPercent)) {
      throw new Error(`Value is too deviated (${deviationPercent}%)`);
    }
  }

  // Calculates max deviation from average of recent values
  getDeviationWithRecentValuesAverage(args: PriceValidationArgs): ISafeNumber {
    const { value, timestamp, deviationConfig, recentPrices } = args;
    const { deviationWithRecentValues } = deviationConfig;

    const priceValuesToCompareWith = recentPrices
      .filter(
        (recentPrice) =>
          timestamp - recentPrice.timestamp <=
          deviationWithRecentValues.maxDelayMilliseconds
      )
      .map((recentPrice) => SafeNumber(recentPrice.value));

    if (priceValuesToCompareWith.length === 0) {
      return SafeNumber(0);
    } else {
      const recentPricesAvg = calculateAverageValue(priceValuesToCompareWith);
      return calculateDeviationPercent({
        measuredValue: value,
        trueValue: recentPricesAvg,
      });
    }
  }

  filterPricesForSigning(
    prices: PriceDataAfterAggregation[]
  ): PriceDataAfterAggregation[] {
    return prices.filter((p) => !this.manifest.tokens[p.symbol].skipSigning);
  }

  preparePricesForSigning(
    prices: PriceDataAfterAggregation[],
    idArTransaction: string,
    providerAddress: string
  ): PriceDataBeforeSigning[] {
    const pricesBeforeSigning: PriceDataBeforeSigning[] = [];

    for (const price of prices) {
      pricesBeforeSigning.push({
        ...price,
        permawebTx: idArTransaction,
        provider: providerAddress,
      });
    }

    return pricesBeforeSigning;
  }

  private deviationCheckConfig(priceSymbol: string): DeviationCheckConfig {
    const deviationCheckConfig =
      ManifestHelper.getDeviationCheckConfigForSymbol(
        priceSymbol,
        this.manifest
      );
    if (!deviationCheckConfig) {
      terminateWithManifestConfigError(
        `Could not determine deviationCheckConfig for ${priceSymbol}. ` +
          `Did you forget to add deviationCheck parameter in the manifest file?`
      );
    }
    return deviationCheckConfig;
  }

  assertSourcesNumber(price: PriceDataAfterAggregation, manifest: Manifest) {
    const { symbol, source } = price;
    const sources = Object.keys(source);
    const sourcesFetchedCount = sources.length;
    const minValidSourcesPercentage =
      ManifestHelper.getMinValidSourcesPercentage(manifest);
    const allSourcesCount = ManifestHelper.getAllSourceCount(symbol, manifest);
    const validSourcesPercentage =
      (sourcesFetchedCount / allSourcesCount) * 100;
    const isSourcesNumberValid =
      validSourcesPercentage >= minValidSourcesPercentage;
    if (!isSourcesNumberValid) {
      throw new Error(
        `Invalid sources number for symbol ${symbol}. ` +
          `Valid sources count: ${sourcesFetchedCount}. ` +
          `Valid sources: ${sources.join(",")}`
      );
    }
  }
}
