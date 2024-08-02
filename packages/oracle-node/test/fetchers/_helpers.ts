import { savePrices } from "../../src/db/local-db";
import axios from "axios";
import { SafeNumber } from "@redstone-finance/utils";
import { Wallet } from "ethers";
import { deployContract } from "ethereum-waffle";
import {
  NotSanitizedPriceDataBeforeAggregation,
  PriceDataAfterAggregation,
  PriceDataFetchedValue,
  SanitizedPriceDataBeforeAggregation,
} from "../../src/types";
import Multicall2 from "../../src/fetchers/evm-chain/shared/abis/Multicall2.abi.json";
import { WebSocketServer } from "ws";

export const saveMockPriceInLocalDb = async (
  value: number,
  symbol: string = "USDT",
  timestampMilliseconds?: number
) => {
  const priceToSave = sanitizePrice(
    preparePrice({
      symbol,
    })
  );
  const sanitizedValue = SafeNumber.createSafeNumber(value);
  await savePrices([
    {
      value: sanitizedValue,
      ...priceToSave,
      timestamp: timestampMilliseconds ?? priceToSave.timestamp,
    },
  ]);
};

export const saveMockPricesInLocalDb = async (
  values: number[],
  symbols: string[]
) => {
  const pricesToSave = symbols.map((symbol, index) => ({
    ...sanitizePrice(
      preparePrice({
        symbol,
      })
    ),
    value: SafeNumber.createSafeNumber(values[index]),
  }));
  await savePrices(pricesToSave);
};

export function mockFetcherResponse(pathToResponseFile: string) {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const exampleResponse = require(pathToResponseFile) as unknown;
  mockedAxios.get.mockResolvedValue({ data: exampleResponse });
  mockedAxios.post.mockResolvedValue({ data: exampleResponse });
}

export function mockFetcherResponseOnce(pathToResponseFile: string) {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const exampleResponse = require(pathToResponseFile) as unknown;
  mockedAxios.get.mockResolvedValueOnce({ data: exampleResponse });
  mockedAxios.post.mockResolvedValueOnce({ data: exampleResponse });
}

export function mockFetcherResponseWithFunction(getResponse: () => unknown) {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  mockedAxios.get.mockResolvedValue({ data: getResponse() });
  mockedAxios.post.mockResolvedValue({ data: getResponse() });
}

export function mockWsFetcherResponse<Req, Res>(
  port: number,
  handler: (request: Req) => Res
) {
  const server = new WebSocketServer({ port });

  server.on("connection", function connection(ws) {
    ws.on("error", console.error);

    ws.on("message", function message(rawData) {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const requestData: Req = JSON.parse(rawData.toString()) as Req;
      const response: Res = handler(requestData);

      ws.send(
        typeof response === "string" ? response : JSON.stringify(response)
      );
      ws.close();
      server.close();
    });
  });
}

export function mockFetcherResponseOnceWithFunction(
  getResponse: () => unknown
) {
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
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const exampleResponse = require(pathToResponseFile) as unknown;

          return Promise.resolve({
            data: exampleResponse,
          });
        },
      };
    });
  });
}

// for testing purposes we allow to insert value property in not sanitized price to simplify tests setup
type OptionalValue = {
  value?: PriceDataFetchedValue;
};

export const preparePrice = (
  partialPrice: Partial<NotSanitizedPriceDataBeforeAggregation> & OptionalValue
): NotSanitizedPriceDataBeforeAggregation => {
  const testTimestamp = Date.now();
  const defaultPrice: NotSanitizedPriceDataBeforeAggregation = {
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
  partialPrices: Partial<
    NotSanitizedPriceDataBeforeAggregation & OptionalValue
  >[]
): NotSanitizedPriceDataBeforeAggregation[] => partialPrices.map(preparePrice);

export const sanitizePrice = (
  notSanitizedPrice: NotSanitizedPriceDataBeforeAggregation & OptionalValue
): SanitizedPriceDataBeforeAggregation => {
  const newSoruces = {} as Record<string, SafeNumber.ISafeNumber>;
  for (const s in notSanitizedPrice.source) {
    newSoruces[s] = SafeNumber.createSafeNumber(notSanitizedPrice.source[s]!);
  }
  return {
    ...notSanitizedPrice,
    source: newSoruces,
  };
};

export const sanitizePrices = (
  notSanitizePrices: (NotSanitizedPriceDataBeforeAggregation & OptionalValue)[]
) => notSanitizePrices.map(sanitizePrice);

// we allow two options: value can be passed directly in the price object or as a separate property
export const aggregatePrice = (
  sanitizedPrice: SanitizedPriceDataBeforeAggregation & OptionalValue,
  value?: PriceDataFetchedValue
): PriceDataAfterAggregation => ({
  ...sanitizedPrice,
  value: SafeNumber.createSafeNumber(
    (sanitizedPrice.value ?? value) as SafeNumber.NumberArg
  ),
});

export const aggregatePrices = (
  sanitizedPrices: (SanitizedPriceDataBeforeAggregation & OptionalValue)[],
  values?: PriceDataFetchedValue[]
): PriceDataAfterAggregation[] =>
  sanitizedPrices.map((price, index) => aggregatePrice(price, values?.[index]));

export const prepareSanitizeAndAggregatePrices = (
  partialPrices: (Partial<NotSanitizedPriceDataBeforeAggregation> &
    OptionalValue)[],
  values?: PriceDataFetchedValue[]
): PriceDataAfterAggregation[] =>
  aggregatePrices(sanitizePrices(preparePrices(partialPrices)), values);

export const deployMulticallContract = async (wallet: Wallet) => {
  return await deployContract(wallet, {
    bytecode: Multicall2.bytecode,
    abi: Multicall2.abi,
  });
};

export const asAwaitable = <T = void>(awaitableObject: unknown): Promise<T> => {
  return awaitableObject as Promise<T>;
};
