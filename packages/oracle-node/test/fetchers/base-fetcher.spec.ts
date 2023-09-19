import { BaseFetcher } from "../../src/fetchers/BaseFetcher";
import { PriceDataFetchedValue } from "../../src/types";
import { isDefined } from "../../src/utils/objects";

class BaseFetcherImpl extends BaseFetcher {
  constructor() {
    super("test");
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
});
