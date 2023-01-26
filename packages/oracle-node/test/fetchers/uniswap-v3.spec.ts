import fetchers from "../../src/fetchers/index";
import {
  mockFetcherResponse,
  mockFetcherResponseWithFunction,
} from "./_helpers";

const pathToExampleResponse =
  "./mocks/responses/uniswap-v3-example-response.json";
const expectedResult = [
  {
    symbol: "OHM",
    value: 9.918039144650795,
  },
  {
    symbol: "UNI",
    value: 6.574866593866394,
  },
];

jest.mock("axios");

describe("uniswap V3 fetcher", () => {
  const sut = fetchers["uniswap-v3"];

  it("should properly fetch data", async () => {
    mockFetcherResponse(pathToExampleResponse);
    const result = await sut.fetchAll(["OHM", "UNI"]);
    expect(result).toEqual(expectedResult);
  });

  it("should retry data fetching", async () => {
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

  it("should fetch only well defined tokens", async () => {
    mockFetcherResponse(pathToExampleResponse);
    const result = await sut.fetchAll(["OHM", "UNI", "FRAX"]);
    expect(result).toEqual(expectedResult);
  });
});
