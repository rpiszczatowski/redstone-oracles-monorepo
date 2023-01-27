import fetchers from "../../src/fetchers/index";
import {
  mockFetcherResponse,
  mockFetcherResponseWithFunction,
} from "./_helpers";

const pathToExampleResponse =
  "../../src/fetchers/pangolin/example-response.json";

jest.mock("axios");

describe("pangolin-wavax fetcher", () => {
  const sut = fetchers["pangolin-wavax"];

  it("should properly fetch data", async () => {
    // Given
    mockFetcherResponse(pathToExampleResponse);

    // When
    const result = await sut.fetchAll([
      "PNG",
      "QI",
      "SPORE",
      "XAVA",
      "YAK",
      "PTP",
    ]);

    // Then
    expect(result).toEqual(expectedResult);
  });

  it("should retry data fetching", async () => {
    // Given
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

    // When
    const result = await sut.fetchAll([
      "PNG",
      "QI",
      "SPORE",
      "XAVA",
      "YAK",
      "PTP",
    ]);

    // Then
    expect(result).toEqual(expectedResult);
    expect(tryCounter).toEqual(2);
  });
});

const expectedResult = [
  {
    symbol: "PNG",
    value: 1.932385477521399,
  },
  {
    symbol: "PNG_pangolin-wavax_liquidity",
    value: 106274746.33590971,
  },
  {
    symbol: "QI",
    value: 1.1545442496079128,
  },
  {
    symbol: "QI_pangolin-wavax_liquidity",
    value: 285532.26586048375,
  },
  {
    symbol: "SPORE",
    value: 1.5535988940290127e-10,
  },
  {
    symbol: "SPORE_pangolin-wavax_liquidity",
    value: 569816.9321933227,
  },
  {
    symbol: "XAVA",
    value: 3.0086266440424607,
  },
  {
    symbol: "XAVA_pangolin-wavax_liquidity",
    value: 8377217.845422094,
  },
  {
    symbol: "YAK",
    value: 2.531574131043456,
  },
  {
    symbol: "YAK_pangolin-wavax_liquidity",
    value: 464694.2823992324,
  },
  {
    symbol: "PTP",
    value: 1.454891278286737,
  },
  {
    symbol: "PTP_pangolin-wavax_liquidity",
    value: 84961.00088882878,
  },
];
