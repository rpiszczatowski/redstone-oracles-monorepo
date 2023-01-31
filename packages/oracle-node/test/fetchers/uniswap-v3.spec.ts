import { closeLocalLevelDB, setupLocalDb } from "../../src/db/local-db";
import fetchers from "../../src/fetchers/index";
import {
  mockFetcherResponse,
  mockFetcherResponseWithFunction,
  saveMockPriceInLocalDb,
} from "./_helpers";

const pathToExampleResponse =
  "../../src/fetchers/uniswap-v3/uniswap-v3-example-response.json";
const expectedResult = [
  {
    symbol: "OHM",
    value: 9.65277773152638,
  },
  {
    symbol: "UNI",
    value: 6.395158890069053,
  },
];

jest.mock("axios");

describe("uniswap V3 fetcher", () => {
  const sut = fetchers["uniswap-v3"];

  beforeAll(async () => {
    setupLocalDb();
    await saveMockPriceInLocalDb(1570.82, "ETH");
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  test("should properly fetch data", async () => {
    mockFetcherResponse(pathToExampleResponse);
    const result = await sut.fetchAll(["OHM", "UNI"]);
    expect(result).toEqual(expectedResult);
  });

  test("should retry data fetching", async () => {
    const exampleResponse = require(pathToExampleResponse);
    let tryCounter = 0;
    const getResponse = () => {
      tryCounter++;
      if (tryCounter > 1) {
        return exampleResponse;
      } else {
        return undefined;
      }
    };
    mockFetcherResponseWithFunction(getResponse);
    const result = await sut.fetchAll(["OHM", "UNI"]);
    expect(result).toEqual(expectedResult);
    expect(tryCounter).toEqual(2);
  });

  test("should fetch only defined tokens", async () => {
    mockFetcherResponse(pathToExampleResponse);
    const result = await sut.fetchAll(["OHM", "UNI", "FRAX"]);
    expect(result).toEqual(expectedResult);
  });
});
