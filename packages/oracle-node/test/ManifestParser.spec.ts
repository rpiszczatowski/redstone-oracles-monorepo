import ManifestHelper from "../src/manifest/ManifestHelper";
import { Manifest } from "../src/types";

describe("groupTokenBySource", () => {
  const baseManifest = {
    interval: 2000,
    priceAggregator: "median",
    sourceTimeout: 3000,
    deviationCheck: {
      deviationWithRecentValues: {
        maxPercent: 25,
        maxDelayMilliseconds: 300000,
      },
    },
  };

  it("should properly assign tokens to sources", () => {
    const manifest: Manifest = {
      ...baseManifest,
      tokens: {
        BTC: {
          source: ["bitfinex", "ftx"],
        },
        ETH: {
          source: ["binance", "bitfinex"],
        },
        USDT: {
          source: ["ftx", "binance"],
        },
      },
    };

    const result = ManifestHelper.groupTokensBySource(manifest);

    expect(result).toEqual({
      bitfinex: ["BTC", "ETH"],
      ftx: ["BTC", "USDT"],
      binance: ["ETH", "USDT"],
    });
  });

  it("should use default source, if no source for given token is defined", () => {
    const manifest: Manifest = {
      ...baseManifest,
      defaultSource: ["kraken"],
      tokens: {
        BTC: {
          source: ["bitfinex", "ftx"],
        },
        ETH: {},
        USDT: {
          source: ["ftx"],
        },
      },
    };

    const result = ManifestHelper.groupTokensBySource(manifest);

    expect(result).toEqual({
      bitfinex: ["BTC"],
      kraken: ["ETH"],
      ftx: ["BTC", "USDT"],
    });
  });

  it("should use default source if token has defined empty source", () => {
    const manifest: Manifest = {
      ...baseManifest,
      defaultSource: ["kraken"],
      tokens: {
        BTC: {
          source: ["bitfinex", "ftx"],
        },
        ETH: {
          source: [],
        },
        USDT: {
          source: ["ftx"],
        },
      },
    };

    const result = ManifestHelper.groupTokensBySource(manifest);

    expect(result).toEqual({
      bitfinex: ["BTC"],
      kraken: ["ETH"],
      ftx: ["BTC", "USDT"],
    });
  });

  it("should throw error if neither source for token nor default source are defined", () => {
    const manifest: Manifest = {
      ...baseManifest,
      tokens: {
        ETH: {},
        USDT: {
          source: ["ftx"],
        },
      },
    };

    expect(() => ManifestHelper.groupTokensBySource(manifest)).toThrow(
      /global source is not defined/
    );
  });
});

describe("getTimeoutForSource", () => {
  const baseManifest = {
    interval: 2000,
    priceAggregator: "median",
    deviationCheck: {
      deviationWithRecentValues: {
        maxPercent: 25,
        maxDelayMilliseconds: 300000,
      },
    },
    tokens: {
      BTC: {
        source: ["bitfinex", "ftx"],
      },
    },
  };

  it("should throw if source is empty", () => {
    const manifest: Manifest = {
      ...baseManifest,
      sourceTimeout: 5000,
    };

    expect(() => ManifestHelper.getTimeoutForSource("", manifest)).toThrow();
  });

  it("should use default timeout (simple notation)", () => {
    const manifest: Manifest = {
      ...baseManifest,
      sourceTimeout: 5000,
    };

    expect(ManifestHelper.getTimeoutForSource("ftx", manifest)).toEqual(5000);
    expect(ManifestHelper.getTimeoutForSource("binance", manifest)).toEqual(
      5000
    );
    expect(ManifestHelper.getTimeoutForSource("bitfinex", manifest)).toEqual(
      5000
    );
  });
});
