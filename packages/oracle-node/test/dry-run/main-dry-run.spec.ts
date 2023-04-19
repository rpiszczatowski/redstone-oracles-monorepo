import { SignedDataPackage } from "redstone-protocol";
import NodeRunner from "../../src/NodeRunner";
import { DataPackageBroadcastPerformer } from "../../src/aggregated-price-handlers/DataPackageBroadcastPerformer";
import { PriceDataBroadcastPerformer } from "../../src/aggregated-price-handlers/PriceDataBroadcastPerformer";
import {
  MockScheduler,
  dryRunTestNodeConfig,
  getMainManifestTokens,
  getWideSupportTokens,
} from "./helpers";
import ManifestHelper from "../../src/manifest/ManifestHelper";
import { CronScheduler } from "../../src/schedulers/CronScheduler";
import {
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";

const TWENTY_MINUTES_IN_MILLISECONDS = 1000 * 60 * 20;
jest.setTimeout(TWENTY_MINUTES_IN_MILLISECONDS);

const REQUIRED_MAIN_MANIFEST_TOKENS_PERCENTAGE = 0.95;

describe("Main dry run test", () => {
  const runTestNode = async () => {
    const sut = await NodeRunner.create(dryRunTestNodeConfig);
    await sut.run();
  };

  const runNodeMultipleTimes = async (iterationsCount: number) => {
    for (let i = 0; i < iterationsCount; i++) {
      await runTestNode();
    }
  };

  const getPricesForDataFeedId = (dataPackages: SignedDataPackage[]) => {
    const pricesForDataFeedId: { [dataFeedId: string]: number } = {};
    for (const dataPackage of dataPackages) {
      const dataPackageObject = dataPackage.dataPackage.toObj();
      const { dataFeedId, value } = dataPackageObject.dataPoints[0];
      pricesForDataFeedId[dataFeedId] = Number(value);
    }
    return pricesForDataFeedId;
  };

  let mockedBroadcaster: jest.SpyInstance<
    Promise<void>,
    [signedDataPackages: SignedDataPackage[]]
  >;

  beforeAll(() => {
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

  test("Dry run for main manifest", async () => {
    /* 
      We want to run Node 4 times because in order to calculate price of some tokens
      we need price of another tokens f.g. 
      USDC/USDT => AVAX/ETH => TJ_AVAX_ETH_LP => YY_TJ_AVAX_ETH_LP
    */
    await runNodeMultipleTimes(4);
    const dataPackages = (mockedBroadcaster.mock as any).lastCall[0];
    const pricesForDataFeedId = getPricesForDataFeedId(dataPackages);
    const mainManifestTokens = getMainManifestTokens();
    const wideSupportTokens = getWideSupportTokens();
    for (const token of mainManifestTokens) {
      const currentDataFeedPrice = pricesForDataFeedId[token];
      if (!currentDataFeedPrice) {
        console.log(`Missing token ${token} during dry run test`);
      } else {
        if (wideSupportTokens.includes(token)) {
          expect(currentDataFeedPrice).toBeGreaterThan(0);
        }
      }
    }
    const allTokensBroadcasted = Object.keys(pricesForDataFeedId).length;
    const requiredTokensCount =
      REQUIRED_MAIN_MANIFEST_TOKENS_PERCENTAGE * mainManifestTokens.length;
    expect(allTokensBroadcasted).toBeGreaterThan(requiredTokensCount);
  });
});
