import aggregators from "../aggregators";
import { CronScheduler } from "../schedulers/CronScheduler";
import { OnBlockScheduler } from "../schedulers/OnBlockScheduler";
import { Manifest } from "../types";
import { arbitrumProvider } from "../utils/blockchain-providers";
import { validateManifest } from "./validate-manifest";

export type TokensBySource = { [source: string]: string[] };

const DEFAULT_MIN_VALID_SOURCE_PERCENTAGE = 50;
const DEFAULT_SCHEDULER_NAME = "interval";

export default class ManifestHelper {
  // This function converts tokens from manifest to object with the following
  // type: { <SourceName>: <Array of tokens to fetch from source> }
  static groupTokensBySource(manifest: Manifest): TokensBySource {
    const result: TokensBySource = {};

    for (const token in manifest.tokens) {
      const source = manifest.tokens[token].source;

      let sourcesForToken: string[];
      // If no source is defined for token
      // we use default source from manifest
      if (source === undefined || !source.length) {
        if (manifest.defaultSource === undefined) {
          const errMsg =
            `Token source is not defined for "${token}"` +
            ` and global source is not defined`;
          throw new Error(errMsg);
        } else {
          sourcesForToken = manifest.defaultSource;
        }
      } else {
        sourcesForToken = source;
      }

      for (const singleSource of sourcesForToken) {
        if (result[singleSource]) {
          result[singleSource].push(token);
        } else {
          result[singleSource] = [token];
        }
      }
    }

    return result;
  }

  static validateManifest(manifest: Manifest) {
    validateManifest(manifest);
  }

  static getTimeoutForSource(source: string, manifest: Manifest) {
    if (!source.length) {
      throw new Error("Timeout for source not defined");
    }
    return manifest.sourceTimeout;
  }

  static getDeviationCheckConfigForSymbol(symbol: string, manifest: Manifest) {
    return manifest.tokens[symbol]?.deviationCheck || manifest.deviationCheck;
  }

  static getAllSourceCount(symbol: string, manifest: Manifest) {
    const allSourcesCount =
      manifest.tokens?.[symbol]?.source?.length ??
      manifest?.defaultSource?.length;
    if (!allSourcesCount) {
      throw new Error(`Cannot define all sources count for symbol ${symbol}`);
    }
    return allSourcesCount;
  }

  static getMinValidSourcesPercentage(manifest: Manifest) {
    return (
      manifest?.minValidSourcesPercentage ?? DEFAULT_MIN_VALID_SOURCE_PERCENTAGE
    );
  }

  static getAggregatorForToken(manifest: Manifest, symbol: string) {
    const aggregatorName =
      manifest.tokens[symbol]?.priceAggregator ?? manifest.priceAggregator;
    return aggregators[aggregatorName];
  }

  static getScheduler(manifest: Manifest) {
    const schedulerName = manifest.useCustomScheduler ?? DEFAULT_SCHEDULER_NAME;

    const schedulerGetters = {
      "on-each-arbitrum-block": () => new OnBlockScheduler(arbitrumProvider),
      interval: (manifest: Manifest) => new CronScheduler(manifest.interval!),
    };

    return schedulerGetters[schedulerName](manifest);
  }

  static getDataFeedDecimals(manifest: Manifest, symbol: string) {
    const dataFeedDetails = manifest?.tokens?.[symbol];
    if (!dataFeedDetails) {
      throw new Error(
        `Missing token ${symbol} in the manifest, cannot get decimals`
      );
    }
    return dataFeedDetails?.decimals;
  }

  static getAllTokensConfig(manifest: Manifest) {
    return manifest.tokens;
  }
}
