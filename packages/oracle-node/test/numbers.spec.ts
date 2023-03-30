import { NumberLike } from "redstone-protocol/src/common/utils";
import {
  safelyConvertAnyValueToNumber,
  calculateSum,
  calculateAverageValue,
  calculateDeviationPercent,
  parseToSafeNumber,
  REDSTONE_MIN_NUMBER,
  REDSTONE_MAX_NUMBER,
} from "../src/utils/numbers";

describe("utils/numbers", () => {
  it.each([
    ["0", 0],
    ["1", 1],
    ["123.123", 123.123],
    [0, 0],
    [-0, 0],
    ["-123.123", /Invalid number format/],
    ["-12", /Invalid number format/],
    [1, 1],
    [123.123, 123.123],
    ["0x01", /Invalid number format/],
    ["0.", /Invalid number format/],
    ["0.1.2", /Invalid number format/],
    [".1", /Invalid number format/],
    ["1,1", /Invalid number format/],
    ["1e1", /Invalid number format/],
    ["1e20", /Invalid number format/],
    ["00000000000000000000000000000000000000000000000001", 1],
    ["0000000000000000000000000000000000000000000000000.1", 0.1],
    [`${"0".repeat(100)}.1`, 0.1],
    [Number(), 0],
    [undefined as unknown as NumberLike, /Invalid number format/],
    [null as unknown as NumberLike, /Invalid number format/],
    [NaN, /Invalid number format/],
    [Infinity, /Invalid number format/],
    [+Infinity, /Invalid number format/],
    [-Infinity, /Invalid number format/],
    [REDSTONE_MIN_NUMBER / 10000, 0],
    [REDSTONE_MIN_NUMBER * -1, /Invalid number format/],
    [REDSTONE_MIN_NUMBER, REDSTONE_MIN_NUMBER],
    [
      REDSTONE_MAX_NUMBER + 1,
      /Number is bigger then max number acceptable by REDSTONE/,
    ],
    // 8 decimals number
    ["1.12345678", 1.12345678],
    // 15 decimals number
    ["1.123456781234567", 1.12345678123457],
    // 16 decimals number
    ["1.12345678123456712", 1.12345678123457],
    // 32 decimals number
    ["1.12345678123456781234567812345678", 1.12345678123457],
    // 64 decimals number
    [
      "1.1234567812345678123456781234567812345678123456781234567812345678",
      1.12345678123457,
    ],
    [REDSTONE_MIN_NUMBER / 2, 0],
    [REDSTONE_MIN_NUMBER / 2, 0],
    [REDSTONE_MIN_NUMBER * -0.5, -0],
  ])(
    "parseToSafeNumber %s to %s",
    (value: NumberLike, expected: number | RegExp) => {
      if (typeof expected === "number") {
        expect(parseToSafeNumber(value)).toBe(expected);
      } else {
        expect(() => parseToSafeNumber(value)).toThrowError(expected);
      }
    }
  );

  describe("safelyConvertAnyValueToNumber", () => {
    const numbersToCheck = [42, 4212312, 0, -1, 12342.323423123221];

    it("Should properly convert strings to numbers", () => {
      for (const num of numbersToCheck) {
        const convertedNum = safelyConvertAnyValueToNumber(String(num));
        expect(convertedNum).toBe(num);
      }
    });

    it("Should properly convert numbers to numbers", () => {
      for (const num of numbersToCheck) {
        const convertedNum = safelyConvertAnyValueToNumber(num);
        expect(convertedNum).toBe(num);
      }
    });

    it("Should return NaN for not string or valid numbers", () => {
      const nanValues = [
        NaN,
        null,
        undefined,
        false,
        true,
        {},
        { haha: 12 },
        [3, 2, 4],
      ];
      for (const nanValue of nanValues) {
        expect(safelyConvertAnyValueToNumber(nanValue)).toBe(NaN);
      }
    });
  });

  describe("calculateSum", () => {
    it("Should properly calculate sum for empty array", () => {
      expect(calculateSum([])).toBe(0);
    });

    it("Should properly calculate sum for 1-elem array", () => {
      expect(calculateSum([42])).toBe(42);
    });

    it("Should properly calculate sum for 3-elem array", () => {
      expect(calculateSum([42, 100, 1000])).toBe(1142);
    });

    it("Should properly calculate sum for a big array", () => {
      const bigArr = Array(2000).fill(120000);
      expect(calculateSum(bigArr)).toBe(120000 * 2000);
    });
  });

  describe("calculateAverageValue", () => {
    it("Should properly calculate an average value for 1-elem arrays", () => {
      expect(calculateAverageValue([42])).toBe(42);
      expect(calculateAverageValue([142])).toBe(142);
      expect(calculateAverageValue([120])).toBe(120);
    });

    it("Should properly calculate an average value for a 3-elem array", () => {
      expect(calculateAverageValue([42, 44, 43])).toBe(43);
    });

    it("Should properly calculate an average value for a big array", () => {
      const bigArr = Array(2000).fill(1121315);
      expect(calculateAverageValue(bigArr)).toBe(1121315);
    });

    it("Should throw for an empty array", () => {
      expect(() => calculateAverageValue([])).toThrow(
        "Can not calculate an average value for an empty array"
      );
    });
  });

  describe("calculateDeviationPercent", () => {
    it("Should properly calculate zero deviation", () => {
      expect(
        calculateDeviationPercent({ measuredValue: 10.5, trueValue: 10.5 })
      ).toBe(0);
    });

    it("Should properly calculate big deviations", () => {
      expect(
        calculateDeviationPercent({ measuredValue: 1, trueValue: 10 })
      ).toBe(90);

      expect(
        calculateDeviationPercent({ measuredValue: 10, trueValue: 1 })
      ).toBe(900);
    });

    it("Should properly calculate deviation with a negative value", () => {
      expect(
        calculateDeviationPercent({ measuredValue: -42, trueValue: 42 })
      ).toBe(200);
    });

    it("Should work with zero value", () => {
      expect(
        calculateDeviationPercent({ measuredValue: 1, trueValue: 0 })
      ).toBe(REDSTONE_MAX_NUMBER);
    });

    it("Should properly calculate deviation for zero measured value and non-zero true value", () => {
      expect(
        calculateDeviationPercent({ measuredValue: 0, trueValue: 1 })
      ).toBe(100);
    });
  });
});
