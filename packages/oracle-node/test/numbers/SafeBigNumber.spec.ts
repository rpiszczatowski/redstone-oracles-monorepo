import { BigNumber, BigNumberish } from "ethers";
import { SafeBigNumber } from "../../src/numbers/SafeBigNumber";

const DEFAULT_DECIMALS = 8;

describe("SafeBigNumber", () => {
  describe("from", () => {
    test.each([
      ["0", BigNumber.from(0)],
      ["1", BigNumber.from(1)],
      ["123.123", /invalid BigNumber string/],
      [0, BigNumber.from(0)],
      [-0, BigNumber.from(0)],
      [BigNumber.from(345), BigNumber.from(345)],
      ["-123.123", /invalid BigNumber string/],
      ["-12", BigNumber.from(-12)],
      [1, BigNumber.from(1)],
      [123.123, /underflow/],
      ["0x01", BigNumber.from(1)],
      ["0.", /invalid BigNumber string/],
      ["0.1.2", /invalid BigNumber string/],
      [".1", /invalid BigNumber string/],
      ["1,1", /invalid BigNumber string/],
      ["1e1", /invalid BigNumber string/],
      ["1E+2", /invalid BigNumber string/],
      ["00000000000000000000000000000000000000000000000001", BigNumber.from(1)],
      [
        "0000000000000000000000000000000000000000000000000.1",
        /invalid BigNumber string/,
      ],
      [`${"0".repeat(100)}.1`, /invalid BigNumber string/],
      [Number(), BigNumber.from(0)],
      [undefined as unknown as BigNumberish, /Invalid BigNumberish format/],
      [null as unknown as BigNumberish, /Invalid BigNumberish format/],
      [NaN, /invalid BigNumber string/],
      [Infinity, /overflow/],
      [+Infinity, /overflow/],
      [-Infinity, /overflow/],
    ])(
      "parse to SafeBigNumber %s to %s",
      (value: BigNumberish, expected: BigNumber | RegExp) => {
        if (expected instanceof BigNumber) {
          expect(SafeBigNumber.from(value, DEFAULT_DECIMALS).eq(expected));
        } else {
          expect(() =>
            SafeBigNumber.from(value, DEFAULT_DECIMALS)
          ).toThrowError(expected as RegExp);
        }
      }
    );
  });

  describe("arithmetic operations", () => {
    describe("add", () => {
      test("should add", () => {
        const result = SafeBigNumber.from("100131", DEFAULT_DECIMALS).add(
          "100123"
        );
        expect(result).toEqual(SafeBigNumber.from("200254", DEFAULT_DECIMALS));
      });
      test("should add value < 0", () => {
        const result = SafeBigNumber.from("120132", DEFAULT_DECIMALS).add(
          "-120"
        );
        expect(result).toEqual(SafeBigNumber.from("120012", DEFAULT_DECIMALS));
      });
      test("should throw invalid BigNumber string", () => {
        expect(() =>
          SafeBigNumber.from("120132", DEFAULT_DECIMALS).add("1.23")
        ).toThrowError("invalid BigNumber string");
      });
    });

    describe("sub", () => {
      test("should sub", () => {
        const result = SafeBigNumber.from("120132", DEFAULT_DECIMALS).sub(
          "123"
        );
        expect(result).toEqual(SafeBigNumber.from("120009", DEFAULT_DECIMALS));
      });
      test("should sub value < 0", () => {
        const result = SafeBigNumber.from("120132", DEFAULT_DECIMALS).sub(
          "-120"
        );
        expect(result).toEqual(SafeBigNumber.from("120252", DEFAULT_DECIMALS));
      });
      test("should throw invalid BigNumber string", () => {
        expect(() =>
          SafeBigNumber.from("120132", DEFAULT_DECIMALS).sub(1.23)
        ).toThrowError("invalid BigNumber string");
      });
    });

    describe("mul", () => {
      test("should mul", () => {
        const result = SafeBigNumber.from(10, DEFAULT_DECIMALS).mul(100);
        expect(result).toEqual(SafeBigNumber.from(1000, DEFAULT_DECIMALS));
      });
    });

    describe("div", () => {
      test("should div", () => {
        const result = SafeBigNumber.from(100, DEFAULT_DECIMALS).div(100);
        expect(result).toEqual(SafeBigNumber.from(1, DEFAULT_DECIMALS));
      });

      test("should return 0 if float < 0", () => {
        const result = SafeBigNumber.from(10, DEFAULT_DECIMALS).div(100);
        expect(result).toEqual(SafeBigNumber.from(0, DEFAULT_DECIMALS));
      });

      test("should return integer if div result is float", () => {
        const result = SafeBigNumber.from(123, DEFAULT_DECIMALS).div(43);
        expect(result).toEqual(SafeBigNumber.from(2, DEFAULT_DECIMALS));
      });
    });
  });

  describe("comparison operations", () => {
    describe("eq", () => {
      test("should be eq", () => {
        const result = SafeBigNumber.from(100, DEFAULT_DECIMALS).eq(100);
        expect(result).toEqual(true);
      });
      test("shouldn't be eq", () => {
        const result = SafeBigNumber.from(100, DEFAULT_DECIMALS).eq(90);
        expect(result).toEqual(false);
      });
    });

    describe("lt", () => {
      test("should be lt", () => {
        const result = SafeBigNumber.from(32, DEFAULT_DECIMALS).lt(100);
        expect(result).toEqual(true);
      });
      test("shouldn't be lt", () => {
        const result = SafeBigNumber.from(100, DEFAULT_DECIMALS).lt(12);
        expect(result).toEqual(false);
      });
    });

    describe("lte", () => {
      test("should be lte", () => {
        const result = SafeBigNumber.from(100, DEFAULT_DECIMALS).lte(100);
        expect(result).toEqual(true);
      });
      test("shouldn't be lte", () => {
        const result = SafeBigNumber.from(100, DEFAULT_DECIMALS).lte(90);
        expect(result).toEqual(false);
      });
    });

    describe("gt", () => {
      test("should be gt", () => {
        const result = SafeBigNumber.from(100, DEFAULT_DECIMALS).gt(1);
        expect(result).toEqual(true);
      });
      test("shouldn't be gt", () => {
        const result = SafeBigNumber.from(3, DEFAULT_DECIMALS).gt(100);
        expect(result).toEqual(false);
      });
    });

    describe("gte", () => {
      test("should be gte", () => {
        const result = SafeBigNumber.from(100, DEFAULT_DECIMALS).gte(100);
        expect(result).toEqual(true);
      });
      test("shouldn't be gte", () => {
        const result = SafeBigNumber.from(12, DEFAULT_DECIMALS).gte(100);
        expect(result).toEqual(false);
      });
    });

    describe("assertNonNegative", () => {
      test("should be positive", () => {
        SafeBigNumber.from(12, DEFAULT_DECIMALS).assertNonNegative();
      });

      test("should be negative", () => {
        expect(() =>
          SafeBigNumber.from(-12, DEFAULT_DECIMALS).assertNonNegative()
        ).toThrowError("Assertion failed");
      });
    });
  });
});
