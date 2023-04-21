import axios from "axios";
import { Consola } from "consola";
import { v4 as uuidv4 } from "uuid";
import fetchers from "./index";
import ManifestHelper, { TokensBySource } from "../manifest/ManifestHelper";
import {
  DeviationCheckConfig,
  Manifest,
  PriceDataAfterAggregation,
  PriceDataBeforeAggregation,
  PriceDataBeforeSigning,
  PriceDataFetched,
} from "../types";
import { trackEnd, trackStart } from "../utils/performance-tracker";
import { promiseTimeout } from "../utils/promise-timeout";
import { getPrices, PriceValueInLocalDB } from "../db/local-db";
import {
  calculateAverageValue,
  safelyConvertAnyValueToNumber,
  calculateDeviationPercent,
} from "../utils/numbers";
import { IterationContext } from "../schedulers/IScheduler";
import { terminateWithManifestConfigError } from "../Terminator";
import { stringifyError } from "../utils/error-stringifier";
import { config } from "../config";

const VALUE_FOR_FAILED_FETCHER = "error";

const logger = require("../utils/logger")("PricesFetcher") as Consola;

export type PricesDataFetched = { [source: string]: PriceDataFetched[] };
export type PricesBeforeAggregation = {
  [token: string]: PriceDataBeforeAggregation;
};

export interface PriceValidationArgs {
  value: number;
  timestamp: number;
  deviationConfig: DeviationCheckConfig;
  recentPrices: PriceValueInLocalDB[];
  priceLimits?: PriceLimits;
}

interface PriceValidationResult {
  isValid: boolean;
  reason: string;
}

interface PriceLimits {
  lower: number;
  upper: number;
}

interface PricesLimits {
  [symbol: string]: PriceLimits;
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
      - aggregated prices hard limits
  */
  async calculateAggregatedValues(
    prices: PriceDataBeforeAggregation[]
  ): Promise<PriceDataAfterAggregation[]> {
    const pricesInLocalDB = await getPrices(prices.map((p) => p.symbol));
    const pricesLimits = await this.fetchPricesLimits();

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

        // Throwing an error if price is invalid, too deviated or out of hard limits
        this.assertValidPrice(
          priceAfterAggregation,
          pricesInLocalDBForSymbol,
          deviationCheckConfig,
          pricesLimits
        );

        // Throwing an error if not enough sources for symbol
        this.assertSourcesNumber(priceAfterAggregation, this.manifest);

        aggregatedPrices.push(priceAfterAggregation);
      } catch (e: any) {
        logger.error(`Symbol ${price.symbol}, ${e.stack}`);
      }
    }

    return aggregatedPrices;
  }

  // This function converts all source values to numbers
  // and excludes sources with invalid values
  sanitizeSourceValues(
    price: PriceDataBeforeAggregation,
    recentPricesInLocalDBForSymbol: PriceValueInLocalDB[],
    deviationCheckConfig: DeviationCheckConfig
  ): PriceDataBeforeAggregation {
    const newSources: { [symbol: string]: number } = {};

    for (const [sourceName, valueFromSource] of Object.entries(price.source)) {
      const valueFromSourceNum = safelyConvertAnyValueToNumber(valueFromSource);
      const { isValid, reason } = this.validatePrice({
        value: valueFromSourceNum,
        timestamp: price.timestamp,
        deviationConfig: deviationCheckConfig,
        recentPrices: recentPricesInLocalDBForSymbol,
      });

      if (isValid) {
        newSources[sourceName] = valueFromSourceNum;
      } else {
        logger.warn(
          `Excluding ${price.symbol} value ${valueFromSourceNum} for source: ${sourceName}. Reason: ${reason}`
        );
      }
    }

    return { ...price, source: newSources };
  }

  assertValidPrice(
    price: PriceDataAfterAggregation,
    recentPricesInLocalDBForSymbol: PriceValueInLocalDB[],
    deviationCheckConfig: DeviationCheckConfig,
    pricesLimits: PricesLimits
  ) {
    const { isValid, reason } = this.validatePrice({
      value: price.value,
      timestamp: price.timestamp,
      deviationConfig: deviationCheckConfig,
      recentPrices: recentPricesInLocalDBForSymbol,
      priceLimits: pricesLimits[price.symbol],
    });

    if (!isValid) {
      throw new Error(
        `Invalid price for symbol ${price.symbol}. Reason: ${reason}`
      );
    }
  }

  validatePrice(args: PriceValidationArgs): PriceValidationResult {
    const { value, deviationConfig, priceLimits } = args;
    const { deviationWithRecentValues } = deviationConfig;

    let isValid = false;
    let reason = "";

    if (isNaN(value)) {
      reason = `Value is not a number. Received: ${value}`;
    } else if (value < 0) {
      reason = "Value is less than 0";
    } else {
      const deviationPercent = this.getDeviationWithRecentValuesAverage(args);

      if (deviationPercent > deviationWithRecentValues.maxPercent) {
        reason = `Value is too deviated (${deviationPercent}%)`;
      } else if (
        priceLimits &&
        (value > priceLimits.upper || value < priceLimits.lower)
      ) {
        const { lower, upper } = priceLimits;
        reason = `Value is out of hard limits (value: ${value}, limits: ${lower}-${upper})`;
      } else {
        isValid = true;
      }
    }

    return {
      isValid,
      reason,
    };
  }

  // Calculates max deviation from average of recent values
  getDeviationWithRecentValuesAverage(args: PriceValidationArgs): number {
    const { value, timestamp, deviationConfig, recentPrices } = args;
    const { deviationWithRecentValues } = deviationConfig;

    const priceValuesToCompareWith = recentPrices
      .filter(
        (recentPrice) =>
          timestamp - recentPrice.timestamp <=
          deviationWithRecentValues.maxDelayMilliseconds
      )
      .map((recentPrice) => recentPrice.value);

    if (priceValuesToCompareWith.length === 0) {
      return 0;
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

  async fetchPricesLimits(): Promise<PricesLimits> {
    if (!config.pricesHardLimitsUrl) {
      return {};
    }
    const response = await axios.get<PricesLimits>(config.pricesHardLimitsUrl);
    return response.data;
  }
}
