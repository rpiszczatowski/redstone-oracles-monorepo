import { DataPackage, SignedDataPackage } from "@redstone-finance/protocol";
import { DataPackageBroadcastPerformer } from "../../src/aggregated-price-handlers/DataPackageBroadcastPerformer";
import { PriceDataBroadcastPerformer } from "../../src/aggregated-price-handlers/PriceDataBroadcastPerformer";
import {
  HARDHAT_MOCK_ADDRESS,
  MockScheduler,
  PricesForDataFeedId,
  getPricesPerDataFeedId,
  getSourcesForToken,
  getTokensFromManifest,
  getTokensWithoutSkipSigning,
  removeSkippedItemsFromManifest,
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
import {
  Manifest,
  NotSanitizedPriceDataBeforeAggregation,
  PriceDataAfterAggregation,
  PriceSource,
  SanitizedPriceDataBeforeAggregation,
} from "../../src/types";
import medianAggregator from "../../src/aggregators/median-aggregator";
import { config as nodeConfig } from "../../src/config";

const TWENTY_MINUTES_IN_MILLISECONDS = 1000 * 60 * 20;
jest.setTimeout(TWENTY_MINUTES_IN_MILLISECONDS);

type SourceDataPerToken = Partial<Record<string, PriceSource<unknown>>>;

const config = getDryRunTestConfig();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(nodeConfig as any) = {
  ...nodeConfig,
  ethereumAddress: config.ethereumAddress ?? HARDHAT_MOCK_ADDRESS,
};

describe("Main dry run test", () => {
  let mockedBroadcaster: jest.SpyInstance<
    Promise<void>,
    [signedDataPackages: SignedDataPackage[]]
  >;

  let spiedMedianAggregator: jest.SpyInstance<
    PriceDataAfterAggregation,
    [
      price: SanitizedPriceDataBeforeAggregation,
      allPrices?: NotSanitizedPriceDataBeforeAggregation[] | undefined,
    ]
  >;

  beforeAll(() => {
    jest.spyOn(DataPackage.prototype, "sign").mockImplementation(function (
      this: DataPackage
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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

    spiedMedianAggregator = jest.spyOn(medianAggregator, "getAggregatedValue");

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
    const tokens = getTokensFromManifest(config.manifest);
    for (let i = 0; i < config.nodeIterations; ++i) {
      await runTestNode(config.manifest);
    }

    const dataPackages = getDataPackagesFromBroadcaster();
    const sourcesData = getSourcesDataFromAggregator();
    const pricesPerDataFeedId = getPricesPerDataFeedId(dataPackages);
    const tokensWithoutSkipSigning = getTokensWithoutSkipSigning(
      config.manifest
    );

    for (const token of tokens) {
      const currentDataFeedPrice = getLastPrice(token);
      if (!currentDataFeedPrice) {
        console.log(
          `Missing token ${token} in local cache during dry run test`
        );
      }
      if (
        !pricesPerDataFeedId[token] &&
        tokensWithoutSkipSigning.includes(token)
      ) {
        console.log(
          `Missing token ${token} in broadcaster during dry run test`
        );
      }
      if (config.additionalCheck) {
        config.additionalCheck(token, currentDataFeedPrice?.value);
      }
      checkTokensBroadcasted(pricesPerDataFeedId, tokensWithoutSkipSigning);
      checkTokensSources(sourcesData, token, config.manifest);
    }
  });

  function getDataPackagesFromBroadcaster() {
    expect(mockedBroadcaster.mock.calls.length).toBeGreaterThan(0);
    return mockedBroadcaster.mock.calls
      .map((call) => call[0])
      .reduce(
        (dataPackages, currentDataPackages) => [
          ...dataPackages,
          ...currentDataPackages,
        ],
        [] as SignedDataPackage[]
      );
  }

  function checkTokensBroadcasted(
    pricesPerDataFeedId: PricesForDataFeedId,
    tokensWithoutSkipSigning: string[]
  ) {
    const allTokensBroadcasted = Object.keys(pricesPerDataFeedId);
    expect(allTokensBroadcasted.sort()).toEqual(
      tokensWithoutSkipSigning.sort()
    );
  }

  function getSourcesDataFromAggregator() {
    expect(spiedMedianAggregator.mock.calls.length).toBeGreaterThan(0);
    return spiedMedianAggregator.mock.calls
      .map((call) => call[0])
      .reduce(
        (pricesData, priceDataBeforeAggregation) => ({
          ...pricesData,
          [priceDataBeforeAggregation.symbol]:
            priceDataBeforeAggregation.source,
        }),
        {} as SourceDataPerToken
      );
  }

  function checkTokensSources(
    sourcesMetadata: SourceDataPerToken,
    token: string,
    manifest: Manifest
  ) {
    const sourcesMetadataForToken = sourcesMetadata[token];
    const sourcesFromManifest = getSourcesForToken(manifest, token);
    if (sourcesMetadataForToken && sourcesFromManifest) {
      const sourcesFetched = Object.keys(sourcesMetadataForToken);
      expect(sourcesFetched.sort()).toEqual(sourcesFromManifest.sort());
    }
  }
});
