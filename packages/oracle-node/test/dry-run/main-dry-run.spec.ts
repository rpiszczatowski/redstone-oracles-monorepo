import { SignedDataPackage } from "redstone-protocol";
import NodeRunner from "../../src/NodeRunner";
import { DataPackageBroadcastPerformer } from "../../src/aggregated-price-handlers/DataPackageBroadcastPerformer";
import { PriceDataBroadcastPerformer } from "../../src/aggregated-price-handlers/PriceDataBroadcastPerformer";
import { MockScheduler, dryRunTestNodeConfig } from "./helpers";
import ManifestHelper from "../../src/manifest/ManifestHelper";
import { CronScheduler } from "../../src/schedulers/CronScheduler";
import {
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";
import wideSupportTokensManifest from "../../manifests/dev/main-wide-support.json";

const TEN_MINUTES_IN_MILLISECONDS = 1000 * 60 * 30;
jest.setTimeout(TEN_MINUTES_IN_MILLISECONDS);

describe("Main dry run test", () => {
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
      .mockImplementation(() => new Promise((resolve) => resolve()));

    setupLocalDb();
  });

  beforeEach(async () => {
    await clearPricesSublevel();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  const runTestNode = async () => {
    const sut = await NodeRunner.create(dryRunTestNodeConfig);
    await sut.run();
  };

  const runNodeMultipleTimes = async (iterationsCount: number) => {
    for (const _index of [...Array(iterationsCount).keys()]) {
      await runTestNode();
    }
  };

  const expectValueBroadcasted = (symbol: string) => {
    expect(mockedBroadcaster).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          dataPackage: expect.objectContaining({
            dataPoints: expect.arrayContaining([
              expect.objectContaining({
                numericDataPointArgs: expect.objectContaining({
                  dataFeedId: symbol,
                  value: expect.any(Number),
                }),
              }),
            ]),
          }),
        }),
      ])
    );
  };

  test("Dry run for main manifest", async () => {
    await runNodeMultipleTimes(4);
    const wideSupportTokens = Object.keys(wideSupportTokensManifest.tokens);
    for (const token of wideSupportTokens) {
      expectValueBroadcasted(token);
    }
  });
});
