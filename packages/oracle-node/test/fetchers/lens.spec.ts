import fetchers from "../../src/fetchers/index";
import { FsBlocksCheckpointer, LensProfileOwnershipFetcher, LensHub } from "../../src/fetchers/lens/LensProfileOwnerShipFetcher";
import { mockFetcherResponse } from "./_helpers";

jest.mock("axios");

describe("lens fetcher", () => {
  const fetcher = fetchers["lens"];

  beforeEach(() => {
    mockFetcherResponse("../../src/fetchers/lens/example-response.json");
  });

  it("should properly fetch data", async () => {
    const result = await fetcher.fetchAll([
      "aaveaave.lens",
      "wagmi.lens",
      "yoginth.lens",
    ]);
    expect(result).toEqual([
      {
        symbol: "aaveaave.lens",
        value: 4627,
      },
      {
        symbol: "wagmi.lens",
        value: 1878.5,
      },
      {
        symbol: "yoginth.lens",
        value: 57483.5,
      },
    ]);
  });
});

describe("lens profile ownership fetcher", () => {
  const checkpointer = new FsBlocksCheckpointer("0x1");
  const lensHub = { fetchProfiles: () => { }, currentBlock: () => { } } as unknown as LensHub;
  const fetcher = new LensProfileOwnershipFetcher(
    lensHub,
    checkpointer
  );

  describe('LensProfileOwnershipFetcher', () => {
    let fetchProfilesSpy: jest.SpyInstance;
    let currentBlockSpy: jest.SpyInstance;

    beforeAll(() => {
      fetchProfilesSpy = jest.spyOn(lensHub, 'fetchProfiles').mockImplementation(() => {
        return Promise.resolve([
          { from: "0x01", to: "0x02", profileId: "0x32" }
        ])
      })

      currentBlockSpy = jest.spyOn(lensHub, 'currentBlock').mockImplementation(() => {
        return Promise.resolve(1200);
      });
    })

    beforeEach(async () => {
      await checkpointer.reset();
      fetchProfilesSpy.mockClear();
      currentBlockSpy.mockClear();
    });

    it('fetcher should be defined', () => {
      expect(fetchers['lens-profiles']).toBeDefined();
    });

    it('should fetch 0-500 blocks on first start', async () => {
      const feed = await fetcher.fetchAll();

      expect(feed).toStrictEqual([{
        symbol: "0x32", value: "0x02"
      }]);

      expect(fetchProfilesSpy).toBeCalledTimes(1);
      expect(fetchProfilesSpy).toBeCalledWith(0, 500);
    });

    it('should fetch 500-1000 blocks, at second call', async () => {
      await fetcher.fetchAll();
      const feed = await fetcher.fetchAll();

      expect(feed).toStrictEqual([{
        symbol: "0x32", value: "0x02"
      }]);

      expect(fetchProfilesSpy).toBeCalledTimes(2);
      expect(fetchProfilesSpy).toBeCalledWith(500, 1000);
    });

    it('should fetch 300-800 blocks, if checkpoint at 300', async () => {
      await checkpointer.checkpoint(300);
      const feed = await fetcher.fetchAll();

      expect(feed).toStrictEqual([{
        symbol: "0x32", value: "0x02"
      }]);

      expect(fetchProfilesSpy).toBeCalledTimes(1);
      expect(fetchProfilesSpy).toBeCalledWith(300, 800);
    });

    it('should fetch 1100-1200 blocks, if current block 1200 and checkpoint at 1100', async () => {
      await checkpointer.checkpoint(1100);
      const feed = await fetcher.fetchAll();

      expect(feed).toStrictEqual([{
        symbol: "0x32", value: "0x02"
      }]);

      expect(fetchProfilesSpy).toBeCalledTimes(1);
      expect(fetchProfilesSpy).toBeCalledWith(1100, 1200);
    });

  });

  describe("checkpointer", () => {
    beforeEach(async () => {
      await checkpointer.reset();
    })

    it('should read 0 if file doesnt exist', async () => {
      expect(await checkpointer.lastSeen())
        .toBe(0);
    });

    it('should checkpoint one', async () => {
      await checkpointer.checkpoint(100);
      expect(await checkpointer.lastSeen())
        .toBe(100);
    });

    it('should checkpoint many', async () => {
      await checkpointer.checkpoint(100);
      await checkpointer.checkpoint(300);
      await checkpointer.checkpoint(10000);
      expect(await checkpointer.lastSeen())
        .toBe(10000);
    });

    it('should reset after many', async () => {
      await checkpointer.checkpoint(100);
      await checkpointer.checkpoint(300);
      await checkpointer.checkpoint(10000);
      await checkpointer.reset();
      expect(await checkpointer.lastSeen())
        .toBe(0);
    });
  });


});
