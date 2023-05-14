import {
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

jest.mock("axios");

describe("permaswap fetcher", () => {
  beforeAll(() => {
    setupLocalDb();
  });
  beforeEach(async () => {
    await clearPricesSublevel();
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

  it("should failed when missing value in db", async () => {
    await saveMockPricesInLocalDb([NaN], ["USDC"]);
    mockFetcherResponse(acnhToUsdcPriceResponse);

    const result = await sut.fetchAll(["ACNH"]);

    expect(result).toEqual([]);
  });

  it("should failed when missing value in db", async () => {
    mockFetcherResponse(acnhToUsdcPriceResponse);

    const result = await sut.fetchAll(["ACNH"]);

    expect(result).toEqual([]);
  });

  it("should return empty array when provider returning undefined", async () => {
    await saveMockPricesInLocalDb([1], ["USDC"]);
    const getResponse = () => undefined;
    mockFetcherResponseWithFunction(getResponse);

    const result = await sut.fetchAll(["ACNH"]);
    expect(result).toEqual([]);
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
