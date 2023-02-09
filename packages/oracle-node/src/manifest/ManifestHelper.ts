import aggregators from "../aggregators";
import { Manifest } from "../types";

export type TokensBySource = { [source: string]: string[] };

const DEFAULT_MIN_VALID_SOURCE_PERCENTAGE = 50;

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

  static getTimeoutForSource(
    source: string,
    manifest: Manifest
  ): number | null {
    if (!source.length) {
      throw "Source for timeout not defined";
    }
    const timeoutConfiguration = manifest.sourceTimeout;
    if (!timeoutConfiguration || typeof timeoutConfiguration !== "number") {
      return null;
    }

    return timeoutConfiguration;
  }

  static getDeviationCheckConfigForSymbol(symbol: string, manifest: Manifest) {
    return manifest.tokens[symbol]?.deviationCheck || manifest.deviationCheck;
  }

  static getAllTokensCount(manifest: Manifest) {
    return Object.keys(manifest.tokens).length;
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
    const priceAggregator =
      manifest.tokens[symbol]?.priceAggregator ?? manifest.priceAggregator;
    return aggregators[priceAggregator];
  }
}
