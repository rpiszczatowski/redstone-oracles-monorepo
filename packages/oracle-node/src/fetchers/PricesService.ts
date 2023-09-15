import { v4 as uuidv4 } from "uuid";
import { RedstoneTypes, SafeNumber } from "@redstone-finance/utils";
import { getPrices, PriceValueInLocalDB } from "../db/local-db";
import ManifestHelper, { TokensBySource } from "../manifest/ManifestHelper";
import { IterationContext } from "../schedulers/IScheduler";
import { terminateWithManifestConfigError } from "../Terminator";
import {
  DeviationCheckConfig,
  Manifest,
  NotSanitizedPriceDataBeforeAggregation,
  PriceDataAfterAggregation,
  PriceDataBeforeSigning,
  PriceDataFetched,
  SanitizedPriceDataBeforeAggregation,
} from "../types";
import { stringifyError } from "../utils/error-stringifier";
import { trackEnd, trackStart } from "../utils/performance-tracker";
import { promiseTimeout } from "../utils/promise-timeout";
import fetchers from "./index";
import { config } from "../config";
import { createMetadataPerSource } from "./MetadataForRedstonePrice";
import loggerFactory from "../utils/logger";
import axios, { AxiosError } from "axios";

export const VALUE_FOR_FAILED_FETCHER = "error";

const logger = loggerFactory("PricesFetcher");

const TRADE_DIRECTIONS = [
  RedstoneTypes.TradeDirection.BUY,
  RedstoneTypes.TradeDirection.SELL,
] as const;

export type PricesDataFetched = { [source: string]: PriceDataFetched[] };
export type PricesBeforeAggregation = {
  [token in string]?: NotSanitizedPriceDataBeforeAggregation;
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
      promises.push(this.safeFetchFromSource(source, tokensBySource[source]!));
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
    } catch (err) {
      const e = err as AxiosError;
      // We don't throw an error because we want to continue with
      // other fetchers even if some fetchers failed
      const resData = e.response ? e.response.data : "";

      // We use warn level instead of error because
      // price fetching errors occur quite often
      logger.warn(
        `Fetching failed for source: ${source}: ${String(resData)}`,
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
      fetchers[source]!.fetchAll(tokens, {
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
  ): PricesBeforeAggregation {
    const result: PricesBeforeAggregation = {};

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

        result[price.symbol]!.source[source] = price.value;
        result[price.symbol]!.sourceMetadata[source] =
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
        const sanitizedPriceBeforeAggregation =
          PricesService.sanitizeSourceValues(
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
        PricesService.assertInHardLimits(
          priceAfterAggregation.value,
          pricesLimits[price.symbol]
        );
        PricesService.assertStableDeviation({
          value: priceAfterAggregation.value,
          timestamp: priceAfterAggregation.timestamp,
          deviationConfig: deviationCheckConfig,
          recentPrices: pricesInLocalDBForSymbol,
        });

        // Throwing an error if not enough sources for symbol
        PricesService.assertSourcesNumber(priceAfterAggregation, this.manifest);

        aggregatedPrices.push(priceAfterAggregation);
      } catch (e) {
        logger.error(`Symbol ${price.symbol}, ${(e as Error).stack}`);
      }
    }

    return aggregatedPrices;
  }

  /**
   * This function converts all source values to Redstone Numbers
   * and excludes sources with invalid values
   * */
  static sanitizeSourceValues(
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

        PricesService.assertStableDeviation({
          value: valueFromSourceNum,
          timestamp: price.timestamp,
          deviationConfig: deviationCheckConfig,
          recentPrices: recentPricesInLocalDBForSymbol,
        });

        PricesService.assertAcceptableSlippageForSource(price, sourceName);

        newSources[sourceName] = valueFromSourceNum;
      } catch (e) {
        if (
          (valueFromSource as unknown as string) !== VALUE_FOR_FAILED_FETCHER
        ) {
          logger.error(
            `Excluding token: "${
              price.symbol
            }", value: "${valueFromSource}" for source: "${sourceName}", reason: "${
              (e as Error).message
            }"`
          );
        }
      }
    }

    return { ...price, source: newSources };
  }

  static assertInHardLimits(
    value: SafeNumber.ISafeNumber,
    priceLimits?: PriceLimits
  ) {
    if (
      priceLimits &&
      (value.gt(priceLimits.upper) || value.lt(priceLimits.lower))
    ) {
      const { lower, upper } = priceLimits;
      throw new Error(
        `Value is out of hard limits (value: ${String(
          value
        )}, limits: ${lower}-${upper})`
      );
    }
  }

  static assertStableDeviation(args: PriceValidationArgs) {
    const { deviationConfig } = args;
    const { deviationWithRecentValues } = deviationConfig;

    const deviationPercent =
      PricesService.getDeviationWithRecentValuesAverage(args);

    if (deviationPercent.gt(deviationWithRecentValues.maxPercent)) {
      throw new Error(`Value is too deviated (${String(deviationPercent)}%)`);
    }
  }

  static assertAcceptableSlippageForSource(
    price: NotSanitizedPriceDataBeforeAggregation,
    sourceName: string
  ) {
    const slippages = price.sourceMetadata[sourceName]?.slippage;
    const amountToCheck = config.simulationValueInUsdForSlippageCheck;
    const maxSlippage = config.maxAllowedSlippagePercent;
    const checkedDirections: { buy: boolean; sell: boolean } = {
      buy: false,
      sell: false,
    };
    const errors: string[] = [];

    // We always check slippage if it's available, but if it's not - we don't
    // throw here. We need to throw on the fetcher level if slippage is not
    // fetched properly
    if (!slippages || slippages.length === 0) {
      return;
    }

    for (const slippage of slippages) {
      if (slippage.simulationValueInUsd === amountToCheck) {
        const { direction, slippageAsPercent } = slippage;
        if (SafeNumber.createSafeNumber(slippageAsPercent).gt(maxSlippage)) {
          errors.push(
            `Slippage is too big (${direction}): ${slippageAsPercent}`
          );
        }
        checkedDirections[direction] = true;
      }
    }

    // We need to check both trade directions
    for (const direction of TRADE_DIRECTIONS) {
      if (!checkedDirections[direction]) {
        errors.push(`Missing slippage check for direction: ${direction}`);
      }
    }

    if (errors.length > 0) {
      const errContext =
        `Failed slippage check for ${price.symbol} from ${sourceName}. ` +
        `Max allowed slippage: ${maxSlippage}% ` +
        `for ${amountToCheck} USD amount. `;
      throw new Error(`${errContext}. ${errors.join(", ")}`);
    }
  }

  // Calculates max deviation from average of recent values
  static getDeviationWithRecentValuesAverage(
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
    return prices.filter((p) => !this.manifest.tokens[p.symbol]!.skipSigning);
  }

  static preparePricesForSigning(
    prices: PriceDataAfterAggregation[],
    idArTransaction: string,
    providerAddress: string
  ): PriceDataBeforeSigning[] {
    const pricesBeforeSigning: PriceDataBeforeSigning[] = [];

    for (const price of prices) {
      pricesBeforeSigning.push({
        ...price,
        value: price.value.unsafeToNumber(),
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

  static assertSourcesNumber(
    price: PriceDataAfterAggregation,
    manifest: Manifest
  ) {
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

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  async fetchPricesLimits(): Promise<PricesLimits> {
    if (config.pricesHardLimitsUrls.length === 0) {
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
