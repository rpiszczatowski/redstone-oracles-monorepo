import { BaseFetcher } from "../../src/fetchers/BaseFetcher";
import { PriceDataFetchedValue } from "../../src/types";
import { isDefined } from "../../src/utils/objects";
import { WebSocketFetcher } from "../../src/fetchers/WebSocketFetcher";

jest.mock("../../src/fetchers/WebSocketFetcher");

class BaseFetcherImpl extends BaseFetcher {
  constructor(wsUrl?: string, pingIntervalMs?: number) {
    super("test", wsUrl, pingIntervalMs);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  override async fetchData(_ids: string[]) {
    throw new Error("Method not implemented.");
  }

  extractPrices(response: Record<string, number>) {
    return this.extractPricesSafely(Object.keys(response), (item) => {
      if (item === "NULL") {
        return undefined as unknown as {
          id: string;
          value: PriceDataFetchedValue;
        };
      }

      let price;
      if (isDefined(response[item])) {
        price = Math.round(response[item]);
      } else {
        throw new Error("Price fail");
      }
      if (response[item] === 420) {
        price = undefined;
      }

      let id: string;
      if (item === "FAIL") {
        throw new Error("Id fail");
      }
      if (item === "MISSING") {
        id = undefined as unknown as string;
      } else {
        id = item.toLocaleUpperCase();
      }

      return { value: price, id };
    });
  }
}

describe("base fetcher", () => {
  describe("extractPriceSafely", () => {
    const sut = new BaseFetcherImpl();

    it("should extract single price", () => {
      expect(sut.extractPrices({ a: 10.5 })).toEqual({ A: 11 });
    });

    it("should extract two prices", () => {
      expect(sut.extractPrices({ a: 10.5, b: 11.1 })).toEqual({ A: 11, B: 11 });
    });

    it("should isolate extract id failure", () => {
      expect(sut.extractPrices({ a: 10.5, FAIL: 2 })).toEqual({
        A: 11,
      });
    });

    it("should isolate extract price failure", () => {
      expect(
        sut.extractPrices({ a: 10.5, b: null as unknown as number })
      ).toEqual({
        A: 11,
      });
    });

    it("should work with 0 value", () => {
      expect(sut.extractPrices({ a: 0, b: 0 })).toEqual({
        A: 0,
        B: 0,
      });
    });

    it("should omit undefined prices", () => {
      expect(sut.extractPrices({ a: 420, b: 0 })).toEqual({
        B: 0,
      });
    });

    it("should omit undefined keys", () => {
      expect(sut.extractPrices({ MISSING: 420, b: 0 })).toEqual({
        B: 0,
      });
    });

    it("should work if pair is not returned at all", () => {
      expect(sut.extractPrices({ NULL: 420, b: 0 })).toEqual({
        B: 0,
      });
    });
  });
  describe("WebSocket functionality", () => {
    let sut: BaseFetcherImpl;
    let mockWebSocketFetcher: jest.Mocked<WebSocketFetcher>;

    beforeEach(() => {
      mockWebSocketFetcher =
        new (WebSocketFetcher as unknown as jest.Mock<WebSocketFetcher>)(
          "ws://test-url",
          1000
        ) as jest.Mocked<WebSocketFetcher>;
      (WebSocketFetcher as unknown as jest.Mock).mockReturnValue(
        mockWebSocketFetcher
      );
      sut = new BaseFetcherImpl("ws://test-url", 1000);
    });

    it("should initialize WebSocketFetcher when URL and interval are provided", () => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockWebSocketFetcher.connect).toHaveBeenCalled();
    });

    it("should fetch data via WebSocket", async () => {
      const ids = ["A", "B"];
      const mockResponse = { A: 11, B: 12 };

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      mockWebSocketFetcher.on.mockImplementation((event, callback) => {
        if (event === "data") {
          callback(JSON.stringify(mockResponse));
        }
      });

      // Mock the fetchData method to avoid "Method not implemented." error
      sut.fetchData = jest.fn().mockResolvedValue(mockResponse);

      const result = await sut.fetchAll(ids);

      expect(result).toEqual([
        { symbol: "A", value: 11 },
        { symbol: "B", value: 12 },
      ]);
    });

    it("should handle WebSocket data fetching error gracefully", async () => {
      const ids = ["A", "B"];
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      mockWebSocketFetcher.on.mockImplementation((event, callback) => {
        if (event === "data") {
          callback("INVALID_JSON");
        }
      });

      // Mock the fetchData method to avoid "Method not implemented." error
      sut.fetchData = jest.fn().mockResolvedValue({});

      await expect(sut.fetchAll(ids)).rejects.toThrow();
    });

    it("should handle missing WebSocketFetcher gracefully", async () => {
      sut = new BaseFetcherImpl();
      const ids = ["A", "B"];
      sut.fetchData = jest.fn().mockResolvedValue({ A: 11, B: 12 });

      const result = await sut.fetchAll(ids);

      expect(result).toEqual([
        { symbol: "A", value: 11 },
        { symbol: "B", value: 12 },
      ]);
    });
  });
});
