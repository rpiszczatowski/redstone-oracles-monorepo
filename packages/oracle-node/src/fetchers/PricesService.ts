import axios from "axios";
import { Consola } from "consola";
import { v4 as uuidv4 } from "uuid";
import { SafeNumber } from "redstone-utils";
import { getPrices, PriceValueInLocalDB } from "../db/local-db";
import ManifestHelper, { TokensBySource } from "../manifest/ManifestHelper";
import { IterationContext } from "../schedulers/IScheduler";
import { terminateWithManifestConfigError } from "../Terminator";
import {
  DeviationCheckConfig,
  Manifest,
  NotSanitizedPriceDataBeforeAggregation,
  PriceDataAfterAggregation,
  PriceDataBeforeAggregation,
  PriceDataBeforeSigning,
  PriceDataFetched,
  PriceDataFetchedValue,
  SanitizedPriceDataBeforeAggregation,
} from "../types";
import { stringifyError } from "../utils/error-stringifier";
import { trackEnd, trackStart } from "../utils/performance-tracker";
import { promiseTimeout } from "../utils/promise-timeout";
import fetchers from "./index";
import { config } from "../config";
import { createMetadataPerSource } from "./MetadataForRedstonePrice";

export const VALUE_FOR_FAILED_FETCHER = "error";

const logger = require("../utils/logger")("PricesFetcher") as Consola;

export type PricesDataFetched = { [source: string]: PriceDataFetched[] };
export type PricesBeforeAggregation<T = number> = {
  [token: string]: PriceDataBeforeAggregation<T>;
};

export interface PriceValidationArgs {
  value: SafeNumber.ISafeNumber;
  timestamp: number;
  deviationConfig: DeviationCheckConfig;
  recentPrices: PriceValueInLocalDB[];
  priceLimits?: PriceLimits;
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
  ): PricesBeforeAggregation<PriceDataFetchedValue> {
    const result: PricesBeforeAggregation<PriceDataFetchedValue> = {};

    for (const source in pricesData) {
      for (const price of pricesData[source]) {
        if (result[price.symbol] === undefined) {
          result[price.symbol] = {
            id: uuidv4(), // Generating unique id for each price
            source: {},
            sourceMetadata: {},
            symbol: price.symbol,
            timestamp: iterationContext.timestamp,
            blockNumber: iterationContext.blockNumber,
            version: nodeVersion,
          };
        }

        result[price.symbol].source[source] = price.value;
        result[price.symbol].sourceMetadata[source] =
          createMetadataPerSource(price);
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
    prices: NotSanitizedPriceDataBeforeAggregation[]
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
          prices as PriceDataBeforeAggregation[]
        );

        // Throwing an error if price < 0 is invalid or too deviated
        priceAfterAggregation.value.assertNonNegative();
        this.assertInHardLimits(
          priceAfterAggregation.value,
          pricesLimits[price.symbol]
        );
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
    price: NotSanitizedPriceDataBeforeAggregation,
    recentPricesInLocalDBForSymbol: PriceValueInLocalDB[],
    deviationCheckConfig: DeviationCheckConfig
  ): SanitizedPriceDataBeforeAggregation {
    const newSources: { [symbol: string]: SafeNumber.ISafeNumber } = {};

    for (const [sourceName, valueFromSource] of Object.entries(price.source)) {
      try {
        if (valueFromSource === undefined || valueFromSource === null) {
          throw new Error("Value from source is undefined");
        }
        const valueFromSourceNum = SafeNumber.createSafeNumber(valueFromSource);

        valueFromSourceNum.assertNonNegative();

        this.assertStableDeviation({
          value: valueFromSourceNum,
          timestamp: price.timestamp,
          deviationConfig: deviationCheckConfig,
          recentPrices: recentPricesInLocalDBForSymbol,
        });

        newSources[sourceName] = valueFromSourceNum;
      } catch (e: any) {
        if (valueFromSource as any as string !== VALUE_FOR_FAILED_FETCHER) {
          logger.error(
            `Excluding token: "${price.symbol}", value: "${valueFromSource}" for source: "${sourceName}", reason: "${e.message}"`
          );
        }
      }
    }

    return { ...price, source: newSources };
  }

  assertInHardLimits(value: SafeNumber.ISafeNumber, priceLimits?: PriceLimits) {
    if (
      priceLimits &&
      (value.gt(priceLimits.upper) || value.lt(priceLimits.lower))
    ) {
      const { lower, upper } = priceLimits;
      throw new Error(
        `Value is out of hard limits (value: ${value}, limits: ${lower}-${upper})`
      );
    }
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
  getDeviationWithRecentValuesAverage(
    args: PriceValidationArgs
  ): SafeNumber.ISafeNumber {
    const { value, timestamp, deviationConfig, recentPrices } = args;
    const { deviationWithRecentValues } = deviationConfig;

    const priceValuesToCompareWith = recentPrices
      .filter(
        (recentPrice) =>
          timestamp - recentPrice.timestamp <=
          deviationWithRecentValues.maxDelayMilliseconds
      )
      .map((recentPrice) => SafeNumber.createSafeNumber(recentPrice.value));

    if (priceValuesToCompareWith.length === 0) {
      return SafeNumber.SafeZero;
    } else {
      const recentPricesAvg = SafeNumber.calculateAverageValue(
        priceValuesToCompareWith
      );
      return SafeNumber.calculateDeviationPercent({
        prevValue: value,
        currValue: recentPricesAvg,
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
    if (
      !config.pricesHardLimitsUrls ||
      config.pricesHardLimitsUrls.length === 0
    ) {
      return {};
    }

    for (let i = 0; i < config.pricesHardLimitsUrls.length; i++) {
      const url = config.pricesHardLimitsUrls[i];

      try {
        const response = await axios.get<PricesLimits>(url);
        logger.info(
          `Fetched hard limit ${JSON.stringify(
            response.data,
            null,
            2
          )} from ${url}`
        );
        return response.data;
      } catch (e) {
        logger.warn(
          `Failed to fetch hard limit from ${url} (${i + 1}/${
            config.pricesHardLimitsUrls.length
          } attempt)`
        );
      }
    }

    throw new Error(
      `Failed to fetch hard limits from ${config.pricesHardLimitsUrls.join(
        ", "
      )} urls`
    );
  }
}
