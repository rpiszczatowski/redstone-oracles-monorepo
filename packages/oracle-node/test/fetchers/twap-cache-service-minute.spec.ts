import { config as _config } from "../../src/config";
import { clearDataPackageFromLocalCache } from "../../src/db/local-db/twap-cache";
import {
  CacheServiceResponsePromise,
  TwapCacheServiceMinuteFetcher,
} from "../../src/fetchers/twap-cache-service-minute/TwapCacheServiceMinuteFetcher";
import rawMockResponse from "../../src/fetchers/twap-cache-service-minute/example-mock-response.json";
import { mockFetcherResponseOnceWithFunction } from "./_helpers";
import { RequestIdToResponse } from "../../src/fetchers/MultiRequestFetcher";
import { RedstoneTypes } from "@redstone-finance/utils";

const mockResponse = rawMockResponse as unknown as RequestIdToResponse<
  CacheServiceResponsePromise[]
>;

jest.useFakeTimers().setSystemTime(1691582400000);
jest.mock("axios");

(_config as unknown) = {
  ethereumAddress: "0x0C39486f770B26F5527BBBf942726537986Cd7eb",
};

describe("twap cache service fetcher", () => {
  beforeEach(() => {
    clearDataPackageFromLocalCache();
  });

  test("should extract twap value from mock response", () => {
    const fetcher = new TwapCacheServiceMinuteFetcher(
      "twap-cache-service-test"
    );
    const twapValue = fetcher.extractPrice("PREMIA-TWAP-60", mockResponse);
    expect(twapValue).toEqual(0.505160093007938);
  });

  test("should use cache to calculate second twap value", async () => {
    const fetcher = new TwapCacheServiceMinuteFetcher("cache-service-test");
    fetcher.extractPrice("PREMIA-TWAP-60", mockResponse);

    const fetcherResult = await fetcher.fetchAll(["PREMIA-TWAP-60"]);
    expect(fetcherResult).toEqual([
      {
        symbol: "PREMIA-TWAP-60",
        value: 0.505160093007938,
      },
    ]);
  });

  test("should fetch data package if missing in local cache", async () => {
    const slicedMockResponse = {
      "PREMIA-TWAP-60": mockResponse["PREMIA-TWAP-60"]!.slice(1),
    };
    const fetcher = new TwapCacheServiceMinuteFetcher("cache-service-test");
    fetcher.extractPrice("PREMIA-TWAP-60", slicedMockResponse);

    mockFetcherResponseOnceWithFunction(
      () =>
        (
          mockResponse[
            "PREMIA-TWAP-60"
          ]![0] as PromiseFulfilledResult<RedstoneTypes.DataPackageFromGatewayResponse>
        ).value
    );
    const fetcherResult = await fetcher.fetchAll(["PREMIA-TWAP-60"]);
    expect(fetcherResult).toEqual([
      {
        symbol: "PREMIA-TWAP-60",
        value: 0.505160093007938,
      },
    ]);
  });

  test("should throw error if not enough responses", () => {
    const slicedMockResponse = {
      "PREMIA-TWAP-60": mockResponse["PREMIA-TWAP-60"]!.slice(20),
    };
    const fetcher = new TwapCacheServiceMinuteFetcher("cache-service-test");
    expect(() =>
      fetcher.extractPrice("PREMIA-TWAP-60", slicedMockResponse)
    ).toThrowError(
      `Invalid number of responses to calculate TWAP, only 33.3% present`
    );
  });
});
