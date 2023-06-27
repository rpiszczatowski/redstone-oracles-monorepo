import {
  clearLastPricesCache,
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";
import fetchers from "../../src/fetchers";
import {
  mockFetcherResponse,
  mockFetcherResponseWithFunction,
  saveMockPricesInLocalDb,
} from "./_helpers";

const ardriveToArPriceResponse =
  "../../src/fetchers/permaswap/example-ardrive-ar-response.json";

const acnhToUsdcPriceResponse =
  "../../src/fetchers/permaswap/example-acnh-usdc-response.json";

const ansToArPriceResponse =
  "../../src/fetchers/permaswap/example-ans-ar-response.json";

jest.mock("axios");

describe("permaswap fetcher", () => {
  beforeAll(() => {
    setupLocalDb();
  });
  beforeEach(async () => {
    await clearPricesSublevel();
    clearLastPricesCache();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  const sut = fetchers["permaswap"];

  it("should properly fetch ARDRIVE price", async () => {
    await saveMockPricesInLocalDb([9], ["AR"]);
    mockFetcherResponse(ardriveToArPriceResponse);

    const result = await sut.fetchAll(["ARDRIVE"]);

    expect(result).toEqual([
      {
        symbol: "ARDRIVE",
        value: 0.69118313301,
      },
    ]);
  });

  it("should properly fetch ACNH price", async () => {
    await saveMockPricesInLocalDb([1], ["USDC"]);
    mockFetcherResponse(acnhToUsdcPriceResponse);

    const result = await sut.fetchAll(["ACNH"]);

    expect(result).toEqual([
      {
        symbol: "ACNH",
        value: 0.14664,
      },
    ]);
  });

  it("should properly fetch ANS price", async () => {
    await saveMockPricesInLocalDb([6.9], ["AR"]);
    mockFetcherResponse(ansToArPriceResponse);

    const result = await sut.fetchAll(["ANS"]);

    expect(result).toEqual([
      {
        symbol: "ANS",
        value: 2.3401329288270003,
      },
    ]);
  });

  it("should fail when missing value in db", async () => {
    mockFetcherResponse(acnhToUsdcPriceResponse);

    const result = await sut.fetchAll(["ACNH"]);

    expect(result).toEqual([]);
  });

  it("should throw error when provider returning undefined", async () => {
    await saveMockPricesInLocalDb([1], ["USDC"]);
    const getResponse = () => undefined;
    mockFetcherResponseWithFunction(getResponse);

    await expect(() => sut.fetchAll(["ACNH"])).rejects.toThrowError(
      'Response is invalid: [{"success":true,"requestId":"ACNH"}]'
    );
  });

  it("should fetch only defined tokens", async () => {
    await saveMockPricesInLocalDb([1], ["USDC"]);
    mockFetcherResponse(acnhToUsdcPriceResponse);

    const result = await sut.fetchAll(["ACNH", "ETH", "BTC"]);

    expect(result).toEqual([
      {
        symbol: "ACNH",
        value: 0.14664,
      },
    ]);
  });
});
