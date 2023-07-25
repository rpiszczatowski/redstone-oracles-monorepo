import { DataPackage, SignedDataPackage } from "redstone-protocol";
import { DataPackageBroadcastPerformer } from "../../src/aggregated-price-handlers/DataPackageBroadcastPerformer";
import { PriceDataBroadcastPerformer } from "../../src/aggregated-price-handlers/PriceDataBroadcastPerformer";
import {
  MockScheduler,
  getPricesForDataFeedId,
  getTokensFromManifest,
  runTestNode,
} from "./helpers";
import ManifestHelper from "../../src/manifest/ManifestHelper";
import { CronScheduler } from "../../src/schedulers/CronScheduler";
import {
  clearPricesSublevel,
  closeLocalLevelDB,
  getLastPrice,
  setupLocalDb,
} from "../../src/db/local-db";
import { getDryRunTestConfig } from "./dry-run-tests-configs";
import { Manifest, TokensConfig } from "../../src/types";

const TWENTY_MINUTES_IN_MILLISECONDS = 1000 * 60 * 20;
jest.setTimeout(TWENTY_MINUTES_IN_MILLISECONDS);

const MIN_REQUIRED_MANIFEST_TOKENS_PERCENTAGE = 0.95;

const config = getDryRunTestConfig();

function removeSkippedItemsFromManifest(manifest: Manifest) {
  const skippedSources = JSON.parse(
    process.env.SKIPPED_SOURCES ?? "[]"
  ) as string[];
  const skippedTokens = JSON.parse(
    process.env.SKIPPED_TOKENS ?? "[]"
  ) as string[];
  let filteredTokens: TokensConfig = {};
  for (const token in manifest.tokens) {
    if (!skippedTokens.includes(token)) {
      filteredTokens[token] = manifest.tokens[token];
      filteredTokens[token].source = filteredTokens[token].source?.filter(
        (s) => !skippedSources.includes(s)
      );
    }
  }
  manifest.tokens = filteredTokens;
}

function removeAlreadyFetchedTokensFromManifest(manifest: Manifest) {
  let filteredTokens: TokensConfig = {};
  for (const token in manifest.tokens) {
    if (!getLastPrice(token)) {
      filteredTokens[token] = manifest.tokens[token];
    }
  }
  manifest.tokens = filteredTokens;
}

describe("Main dry run test", () => {
  let mockedBroadcaster: jest.SpyInstance<
    Promise<void>,
    [signedDataPackages: SignedDataPackage[]]
  >;

  beforeAll(() => {
    jest.spyOn(DataPackage.prototype, "sign").mockImplementation(function () {
      //@ts-ignore
      return new SignedDataPackage(this, {
        r: "r",
        s: "s",
        _vs: "_vs",
        recoveryParam: 0,
        v: 1,
        yParityAndS: "yParityAndS",
        compact: "true",
      });
    });

    jest
      .spyOn(ManifestHelper, "getScheduler")
      .mockImplementation(() => MockScheduler as unknown as CronScheduler);

    jest
      .spyOn(PriceDataBroadcastPerformer.prototype, "handle")
      .mockImplementation(() => Promise.resolve());

    mockedBroadcaster = jest
      .spyOn(DataPackageBroadcastPerformer.prototype, "broadcastDataPackages")
      .mockImplementation(() => Promise.resolve());

    setupLocalDb();
  });

  beforeEach(async () => {
    await clearPricesSublevel();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  test(`Dry run test for ${process.env.DRY_RUN_TEST_TYPE} manifest`, async () => {
    /*
      We want to run Node 4 times because in order to calculate price of some tokens
      we need price of another tokens e.g.
      USDC/USDT -> AVAX/ETH -> TJ_AVAX_ETH_LP -> YY_TJ_AVAX_ETH_LP
    */
    removeSkippedItemsFromManifest(config.manifest);
    for (let i = 0; i < config.nodeIterations; ++i) {
      await runTestNode(config.manifest);
      removeAlreadyFetchedTokensFromManifest(config.manifest);
    }
    const tokens = getTokensFromManifest(config.manifest);
    for (const token of tokens) {
      const currentDataFeedPrice = getLastPrice(token);
      if (!currentDataFeedPrice) {
        console.log(`Missing token ${token} during dry run test`);
      }
      if (config.additionalCheck) {
        config.additionalCheck(token, currentDataFeedPrice?.value);
      }
    }
    expect(mockedBroadcaster.mock.calls.length).toBeGreaterThan(0);
    const dataPackages = mockedBroadcaster.mock.calls
      .map((a) => a[0])
      .reduce((p, c) => {
        p.push(...c);
        return p;
      }, []);
    const pricesForDataFeedId = getPricesForDataFeedId(dataPackages);
    const allTokensBroadcasted = Object.keys(pricesForDataFeedId).length;
    const requiredTokensCount =
      MIN_REQUIRED_MANIFEST_TOKENS_PERCENTAGE * tokens.length;
    expect(allTokensBroadcasted).toBeGreaterThan(requiredTokensCount);
  });
});
