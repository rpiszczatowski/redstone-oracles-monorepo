import aggregators from "../aggregators";
import { Manifest } from "../types";

export type TokensBySource = { [source: string]: string[] };

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

  static getDefaultAggregator(manifest: Manifest) {
    return aggregators[manifest.priceAggregator];
  }

  static getAggregatorForToken(manifest: Manifest, symbol: string) {
    const priceAggregator = manifest.tokens[symbol]?.priceAggregator;
    if (priceAggregator) {
      return aggregators[priceAggregator];
    }
    return this.getDefaultAggregator(manifest);
  }

  static getAggregatorName(manifest: Manifest, symbol: string) {
    const priceAggregator = manifest.tokens[symbol]?.priceAggregator;
    return priceAggregator ? priceAggregator : manifest.priceAggregator;
  }
}
