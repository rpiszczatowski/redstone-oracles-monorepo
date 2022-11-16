import { Consola } from "consola";
import { v4 as uuidv4 } from "uuid";
import fetchers from "./index";
import ManifestHelper, { TokensBySource } from "../manifest/ManifestHelper";
import {
  Aggregator,
  Credentials,
  DeviationCheckConfig,
  Manifest,
  PriceDataAfterAggregation,
  PriceDataBeforeAggregation,
  PriceDataBeforeSigning,
  PriceDataFetched,
} from "../types";
import { trackEnd, trackStart } from "../utils/performance-tracker";
import ManifestConfigError from "../manifest/ManifestConfigError";
import { promiseTimeout } from "../utils/promise-timeout";
import aggregators from "../aggregators";
import localDb, { AllPriceValuesInLocalDB } from "../db/local-db";
import { calculateDeviationPercent } from "../utils/calculate-deviation";

const VALUE_FOR_FAILED_FETCHER = "error";

const logger = require("../utils/logger")("PricesFetcher") as Consola;

export type PricesDataFetched = { [source: string]: PriceDataFetched[] };
export type PricesBeforeAggregation = {
  [token: string]: PriceDataBeforeAggregation;
};

export default class PricesService {
  constructor(private manifest: Manifest, private credentials: Credentials) {}

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
      //not sure why instanceof is not working, crap.
      if (e.name == "ManifestConfigError") {
        throw e;
      } else {
        // We don't throw an error because we want to continue with
        // other fetchers even if some fetchers failed
        const resData = e.response ? e.response.data : "";

        // We use warn level instead of error because
        // price fetching errors occur quite often
        logger.warn(
          `Fetching failed for source: ${source}: ${resData}`,
          e.stack
        );
        return {
          [source]: tokens.map((symbol) => ({
            symbol,
            value: VALUE_FOR_FAILED_FETCHER,
          })),
        };
      }
    }
  }

  async doFetchFromSource(
    source: string,
    tokens: string[]
  ): Promise<PriceDataFetched[]> {
    if (tokens.length === 0) {
      throw new ManifestConfigError(
        `${source} fetcher received an empty array of symbols`
      );
    }

    const fetchPromise = () =>
      fetchers[source].fetchAll(tokens, {
        credentials: this.credentials,
        manifest: this.manifest,
      });

    const sourceTimeout = ManifestHelper.getTimeoutForSource(
      source,
      this.manifest
    );
    if (sourceTimeout === null) {
      throw new ManifestConfigError(
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
    fetchTimestamp: number,
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
            timestamp: fetchTimestamp,
            version: nodeVersion,
          };
        }

        result[price.symbol].source[source] = price.value;
      }
    }

    return result;
  }

  // TODO: this function should calculate aggregated values based on
  // - recent deviations check
  // - zero values filtering
  // - aggregation across different sources (exluding outliers)
  async calculateAggregatedValues(
    prices: PriceDataBeforeAggregation[],
    manifest: Manifest
  ): Promise<PriceDataAfterAggregation[]> {
    const aggregator = aggregators[manifest.priceAggregator];
    const pricesInLocalDB = await localDb.getAllPrices();

    const aggregatedPrices: PriceDataAfterAggregation[] = [];
    for (const price of prices) {
      const deviationCheckConfig = this.deviationCheckConfig(price.symbol);

      try {
        const priceAfterAggregation = aggregator.getAggregatedValue(
          price,
          deviationCheckConfig.maxPercentDeviationForSource!
        );

        // Throws an error if price is invalid or too deviated
        this.assertValidPrice(
          priceAfterAggregation,
          pricesInLocalDB,
          deviationCheckConfig
        );

        aggregatedPrices.push(priceAfterAggregation);
      } catch (e: any) {
        logger.error(e.stack);
      }
    }

    return aggregatedPrices;
  }

  assertValidPrice(
    price: PriceDataAfterAggregation,
    recentPricesInLocalDB: AllPriceValuesInLocalDB,
    deviationCheckConfig: DeviationCheckConfig
  ) {
    // Checking if price value looks valid (non-zero, non-empty)
    if (price.value <= 0 || price.value === undefined) {
      throw new Error("Invalid price value: " + JSON.stringify(price));
    }

    // Checking deviation from recent values
    const { deviationWithRecentValues } = deviationCheckConfig;
    if (deviationWithRecentValues) {
      for (const recentPrice of recentPricesInLocalDB[price.symbol]) {
        const timestampDelay = price.timestamp - recentPrice.timestamp;
        if (timestampDelay <= deviationWithRecentValues.maxDelayMilliseconds) {
          const deviationPercent = calculateDeviationPercent({
            measuredValue: price.value,
            trueValue: recentPrice.value,
          });
          if (deviationPercent > deviationWithRecentValues.maxPercent) {
            const errMsg =
              `Value is too deviated from recent values. ` +
              `Symbol: ${price.symbol}` +
              `Deviation percent: ${deviationPercent}. ` +
              `Recent price: ${JSON.stringify(recentPrice)}. ` +
              `Current value: ${price.value}`;
            throw new Error(errMsg);
          }
        }
      }
    }
  }

  filterPricesForSigning(
    prices: PriceDataAfterAggregation[],
    manifest: Manifest
  ): PriceDataAfterAggregation[] {
    return prices.filter((p) => !manifest.tokens[p.symbol].skipSigning);
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

  // TODO: remove
  // private maxPriceDeviationPercent(priceSymbol: string): number {
  //   const result = ManifestHelper.getDeviationCheckConfigForSymbol(
  //     priceSymbol,
  //     this.manifest
  //   );
  // if (result === null) {
  //   throw new ManifestConfigError(`Could not determine maxPriceDeviationPercent for ${priceSymbol}.
  //     Did you forget to add maxPriceDeviationPercent parameter in the manifest file?`);
  // }
  //   logger.debug(`maxPriceDeviationPercent for ${priceSymbol}: ${result}`);

  //   return result;
  // }

  private deviationCheckConfig(priceSymbol: string): DeviationCheckConfig {
    const deviationCheckConfig =
      ManifestHelper.getDeviationCheckConfigForSymbol(
        priceSymbol,
        this.manifest
      );
    if (!deviationCheckConfig) {
      throw new ManifestConfigError(
        `Could not determine deviationCheckConfig for ${priceSymbol}.` +
          `Did you forget to add deviationCheck parameter in the manifest file?`
      );
    }
    return deviationCheckConfig;
  }
}
