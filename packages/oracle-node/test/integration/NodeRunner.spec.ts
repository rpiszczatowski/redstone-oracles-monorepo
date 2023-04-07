import NodeRunner from "../../src/NodeRunner";
import { JWKInterface } from "arweave/node/lib/wallet";
import fetchers from "../../src/fetchers";
import axios from "axios";
import ArweaveService from "../../src/arweave/ArweaveService";
import { any } from "jest-mock-extended";
import { timeout } from "../../src/utils/promise-timeout";
import { MOCK_NODE_CONFIG } from "../helpers";
import { NodeConfig } from "../../src/types";
import {
  clearLocalDb,
  closeLocalDB,
  setupLocalDb,
  savePrices,
} from "../../src/db/local-db";
import emptyManifest from "../../manifests/dev/empty.json";
import * as Terminator from "../../src/Terminator";

const TEST_PROVIDER_EVM_ADDRESS = "0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A";

/****** MOCKS START ******/
const broadcastingUrl =
  "http://mock-direct-cache-service-url/data-packages/bulk";
const priceDataBroadcastingUrl = "http://mock-price-cache-service-url/prices";

const terminateWithManifestConfigErrorSpy = jest.spyOn(
  Terminator,
  "terminateWithManifestConfigError"
);
terminateWithManifestConfigErrorSpy.mockImplementation((message: string) => {
  throw new Error(`Terminate mock manifest config error: ${message}`);
});

jest.mock("../../src/signers/EvmPriceSigner", () => {
  return jest.fn().mockImplementation(() => {
    return {
      signPricePackage: (pricePackage: any) => ({
        liteSignature: "mock_evm_signed_lite",
        signerAddress: "mock_evm_signer_address",
        pricePackage,
      }),
    };
  });
});

jest.mock("../../src/fetchers/coingecko/CoingeckoFetcher");
jest.mock("../../src/fetchers/uniswap/UniswapFetcher");

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.post.mockImplementation((url) => {
  if (["https://api.redstone.finance/metrics", broadcastingUrl].includes(url)) {
    return Promise.resolve();
  }
  return Promise.reject(
    `mock for ${url} not available and should not be called`
  );
});

let manifest: any = null;

jest.mock("../../src/utils/objects", () => ({
  // @ts-ignore
  ...jest.requireActual("../../src/utils/objects"),
  readJSON: () => null,
}));

jest.mock("uuid", () => ({ v4: () => "00000000-0000-0000-0000-000000000000" }));
/****** MOCKS END ******/

describe("NodeRunner", () => {
  const jwk: JWKInterface = {
    e: "e",
    kty: "kty",
    n: "n",
  };

  const nodeConfig: NodeConfig = MOCK_NODE_CONFIG;

  const runTestNode = async () => {
    const sut = await NodeRunner.create({
      ...nodeConfig,
      overrideManifestUsingFile: manifest,
    });
    await sut.run();
  };

  beforeAll(() => {
    setupLocalDb();
  });

  beforeEach(async () => {
    clearLocalDb();

    jest.useFakeTimers();
    mockedAxios.post.mockClear();

    jest.spyOn(global.Date, "now").mockImplementation(() => 111111111);

    fetchers["coingecko"] = {
      fetchAll: jest.fn().mockResolvedValue([{ symbol: "BTC", value: 444 }]),
    };
    fetchers["uniswap"] = {
      fetchAll: jest.fn().mockResolvedValue([
        { symbol: "BTC", value: 445 },
        {
          symbol: "ETH",
          value: 42,
        },
      ]),
    };

    terminateWithManifestConfigErrorSpy.mockClear();

    manifest = {
      ...emptyManifest,
      defaultSource: ["uniswap"],
      tokens: {
        BTC: {
          source: ["coingecko"],
        },
        ETH: {},
      },
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(async () => {
    await closeLocalDB();
  });

  describe("node set up", () => {
    it("should create node instance", async () => {
      const sut = await NodeRunner.create({
        ...nodeConfig,
        overrideManifestUsingFile: manifest,
      });

      expect(sut).not.toBeNull();
    });

    it("should throw if interval not divisble by 1000", async () => {
      manifest.interval = 60001;
      const sut = await NodeRunner.create({
        ...nodeConfig,
        overrideManifestUsingFile: manifest,
      });
      await sut.run();

      expect(terminateWithManifestConfigErrorSpy).toBeCalledTimes(1);
      expect(terminateWithManifestConfigErrorSpy).toBeCalledWith(
        "Interval needs to be divisible by 1000"
      );
    });

    it("should throw if no maxDeviationPercent configured for token", async () => {
      const { deviationCheck, ...manifestWithoutDeviationCheck } = manifest;

      const sut = await NodeRunner.create({
        ...nodeConfig,
        overrideManifestUsingFile: manifestWithoutDeviationCheck,
      });

      await sut.run();
      expect(terminateWithManifestConfigErrorSpy).toBeCalledTimes(1);
      expect(terminateWithManifestConfigErrorSpy).toBeCalledWith(
        expect.stringMatching(/Could not determine deviationCheckConfig/)
      );
    });

    it("should throw if no sourceTimeout", async () => {
      const { sourceTimeout, ...manifestWithoutSourceTimeout } = manifest;

      const sut = await NodeRunner.create({
        ...nodeConfig,
        overrideManifestUsingFile: manifestWithoutSourceTimeout,
      });

      await sut.run();
      expect(terminateWithManifestConfigErrorSpy).toBeCalledWith(
        expect.stringMatching(/No timeout configured for/)
      );
    });
  });

  describe("standard flow", () => {
    it("should broadcast fetched and signed prices", async () => {
      await runTestNode();

      expect(axios.post).toHaveBeenCalledWith(broadcastingUrl, {
        requestSignature:
          "0x262eda99c935322d84d2431b5d81adfc9b7cc46169240c43ea8973cb3d6e48cd29fb2a4f2df58ba1b0ff785b94cdc700f1f8a2ba7a24394e212dffd0d8fa653f1c",
        dataPackages: [
          {
            signature:
              "sdW2jBaPdAExmaq00AIpqMZu2Dv4NqD0rSn1w9oJcsINKfpxHfS3f+PP1V/5ReBuBF7cxBlkK3ary1g3SPcRchs=",
            timestampMilliseconds: 111111000,
            dataPoints: [
              {
                dataFeedId: "BTC",
                value: 444.5,
              },
            ],
          },
          {
            signature:
              "bC4RSM4PQ+GNydZEGANTeH+5ciIsgNKtV7oKud0Qks0bAvKCexTVZHpB15CIdH07EYpB1ZvmN6HEQVYA8ousvhw=",
            timestampMilliseconds: 111111000,
            dataPoints: [
              {
                dataFeedId: "ETH",
                value: 42,
              },
            ],
          },
          {
            signature:
              "BUQ0bTRTcvwX0HZJRYtts9bXOvlSNCaObSYxHnpyTok6zWggZTDIwxThyd5rcsn5+9gDUNrSVT2ujhy5Ur+O0Rw=",
            timestampMilliseconds: 111111000,
            dataPoints: [
              {
                dataFeedId: "BTC",
                value: 444.5,
              },
              {
                dataFeedId: "ETH",
                value: 42,
              },
            ],
          },
        ],
      });
    });

    it("should broadcast fetched and signed price data", async () => {
      await runTestNode();

      expect(axios.post).toHaveBeenCalledWith(priceDataBroadcastingUrl, [
        {
          liteEvmSignature: "mock_evm_signed_lite",
          id: "00000000-0000-0000-0000-000000000000",
          permawebTx: "mock-permaweb-tx",
          provider: TEST_PROVIDER_EVM_ADDRESS,
          source: { coingecko: 444, uniswap: 445 },
          symbol: "BTC",
          timestamp: 111111000,
          value: 444.5,
          version: "0.4",
        },
        {
          liteEvmSignature: "mock_evm_signed_lite",
          id: "00000000-0000-0000-0000-000000000000",
          permawebTx: "mock-permaweb-tx",
          provider: TEST_PROVIDER_EVM_ADDRESS,
          source: { uniswap: 42 },
          symbol: "ETH",
          timestamp: 111111000,
          value: 42,
          version: "0.4",
        },
      ]);
    });
  });

  describe("invalid values handling", () => {
    const expectValueBroadcasted = (symbol: string, expectedValue: number) => {
      expect(axios.post).toHaveBeenCalledWith(
        broadcastingUrl,
        expect.objectContaining({
          dataPackages: expect.arrayContaining([
            expect.objectContaining({
              dataPoints: expect.arrayContaining([
                expect.objectContaining({
                  dataFeedId: symbol,
                  value: expectedValue,
                }),
              ]),
            }),
          ]),
        })
      );
    };

    it("should not broadcast fetched and signed prices if values deviate too much (maxPercent is 0)", async () => {
      await savePrices([
        { symbol: "BTC", value: 100, timestamp: Date.now() },
      ] as any);
      await runTestNode();
      expectValueBroadcasted("ETH", 42);
    });

    it("should filter out too deviated sources", async () => {
      await savePrices([
        { symbol: "BTC", value: 444, timestamp: Date.now() },
      ] as any);

      // Mocking coingecko fetcher to provide deviated value
      fetchers["coingecko"] = {
        fetchAll: jest.fn().mockResolvedValue([{ symbol: "BTC", value: 100 }]),
      };

      await runTestNode();

      expectValueBroadcasted("BTC", 445);
    });

    it("should filter out invalid sources", async () => {
      await savePrices([
        { symbol: "BTC", value: 444, timestamp: Date.now() },
      ] as any);

      // Mocking coingecko fetcher to provide invalid value
      fetchers["coingecko"] = {
        fetchAll: jest.fn().mockResolvedValue([{ symbol: "BTC", value: 0 }]),
      };

      await runTestNode();

      expectValueBroadcasted("BTC", 445);
    });

    it("should not broadcast if all sources provide invalid value", async () => {
      // Mocking fetchers to provide invalid values
      fetchers["coingecko"] = {
        fetchAll: jest.fn().mockResolvedValue([{ symbol: "BTC", value: -1 }]),
      };
      fetchers["uniswap"] = {
        fetchAll: jest.fn().mockResolvedValue([
          { symbol: "BTC", value: -10 },
          {
            symbol: "ETH",
            value: "error",
          },
        ]),
      };

      await runTestNode();

      expect(axios.post).not.toHaveBeenCalledWith(broadcastingUrl, any());
      expect(axios.post).not.toHaveBeenCalledWith(
        priceDataBroadcastingUrl,
        any()
      );
    });
  });

  describe("when overrideManifestUsingFile flag is null", () => {
    let nodeConfigManifestFromAr: any;
    beforeEach(() => {
      nodeConfigManifestFromAr = {
        ...nodeConfig,
        overrideManifestUsingFile: null,
      };
    });

    it("should download prices when manifest is available", async () => {
      // given
      const arServiceSpy = jest
        .spyOn(ArweaveService.prototype, "getCurrentManifest")
        .mockImplementation(() => Promise.resolve(manifest));

      const sut = await NodeRunner.create(nodeConfigManifestFromAr);

      await sut.run();

      expect(fetchers.uniswap.fetchAll).toHaveBeenCalled();

      arServiceSpy.mockClear();
    });

    it("should not create NodeRunner instance until manifest is available", async () => {
      // given
      jest.useRealTimers();
      let arServiceSpy = jest
        .spyOn(ArweaveService.prototype, "getCurrentManifest")
        .mockImplementation(async () => {
          await timeout(200);
          return Promise.reject("no way!");
        });

      // this effectively makes manifest available after 100ms - so
      // we expect that second manifest fetching trial will succeed.
      setTimeout(() => {
        arServiceSpy = jest
          .spyOn(ArweaveService.prototype, "getCurrentManifest")
          .mockImplementation(() => Promise.resolve(manifest));
      }, 100);
      const sut = await NodeRunner.create(nodeConfigManifestFromAr);
      expect(sut).not.toBeNull();
      expect(ArweaveService.prototype.getCurrentManifest).toHaveBeenCalledTimes(
        2
      );
      arServiceSpy.mockClear();
      jest.useFakeTimers();
    });

    it("should continue working when update manifest fails", async () => {
      // given
      nodeConfigManifestFromAr.manifestRefreshInterval = 0;
      let arServiceSpy = jest
        .spyOn(ArweaveService.prototype, "getCurrentManifest")
        .mockResolvedValueOnce(manifest)
        .mockRejectedValue("timeout");

      const sut = await NodeRunner.create(nodeConfigManifestFromAr);

      await sut.run();

      expect(sut).not.toBeNull();
      expect(ArweaveService.prototype.getCurrentManifest).toHaveBeenCalledTimes(
        2
      );
      expect(fetchers.uniswap.fetchAll).toHaveBeenCalled();
      expect(axios.post).toHaveBeenCalledWith(broadcastingUrl, any());
      expect(axios.post).toHaveBeenCalledWith(priceDataBroadcastingUrl, any());
      arServiceSpy.mockClear();
    });
  });
});
