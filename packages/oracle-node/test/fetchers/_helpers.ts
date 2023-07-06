import { savePrices } from "../../src/db/local-db";
import axios from "axios";
import {
  PriceDataAfterAggregation,
  PriceDataBeforeAggregation,
} from "../../src/types";
import { SafeNumber } from "redstone-utils";

export const saveMockPriceInLocalDb = async (
  value: number,
  symbol: string = "USDT"
) => {
  const priceToSave = preparePrice({
    symbol,
    value: SafeNumber.createSafeNumber(value),
  });
  await savePrices([priceToSave]);
};

export const saveMockPricesInLocalDb = async (
  values: number[],
  symbols: string[]
) => {
  const pricesToPrepare = symbols.map((symbol, index) =>
    preparePrice({
      symbol,
      value: SafeNumber.createSafeNumber(values[index]),
    })
  );
  const pricesToSave = preparePrices(pricesToPrepare);
  await savePrices(pricesToSave);
};

export function mockFetcherResponse(pathToResponseFile: string) {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const exampleResponse = require(pathToResponseFile);
  mockedAxios.get.mockResolvedValue({ data: exampleResponse });
  mockedAxios.post.mockResolvedValue({ data: exampleResponse });
}

export function mockFetcherResponseOnce(pathToResponseFile: string) {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const exampleResponse = require(pathToResponseFile);
  mockedAxios.get.mockResolvedValueOnce({ data: exampleResponse });
  mockedAxios.post.mockResolvedValueOnce({ data: exampleResponse });
}

export function mockFetcherResponseWithFunction(getResponse: () => any) {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  mockedAxios.get.mockResolvedValue({ data: getResponse() });
  mockedAxios.post.mockResolvedValue({ data: getResponse() });
}

export function mockFetcherResponseOnceWithFunction(getResponse: () => any) {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  mockedAxios.get.mockResolvedValueOnce({ data: getResponse() });
  mockedAxios.post.mockResolvedValueOnce({ data: getResponse() });
}

// TODO: find out why this does not work...
export function mockFetcherProxy(
  proxyModule: string,
  pathToResponseFile: string
) {
  jest.mock(proxyModule, () => {
    return jest.fn().mockImplementation(() => {
      return {
        getExchangeRates: () => {
          const exampleResponse = require(pathToResponseFile);

          return Promise.resolve({
            data: exampleResponse,
          });
        },
      };
    });
  });
}

export const preparePrice = (
  partialPrice: Partial<PriceDataAfterAggregation>
): any => {
  const testTimestamp = Date.now();
  const defaultPrice: PriceDataBeforeAggregation = {
    id: "00000000-0000-0000-0000-000000000000",
    symbol: "mock-symbol",
    source: {},
    sourceMetadata: {},
    timestamp: testTimestamp,
    version: "3",
  };
  return {
    ...defaultPrice,
    ...partialPrice,
  };
};

export const preparePrices = (
  partialPrices: Partial<PriceDataAfterAggregation>[]
): any[] => partialPrices.map(preparePrice);
