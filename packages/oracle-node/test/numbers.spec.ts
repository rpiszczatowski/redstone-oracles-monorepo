import {
  safelyConvertAnyValueToNumber,
  calculateSum,
  calculateAverageValue,
  calculateDeviationPercent,
} from "../src/utils/numbers";

describe("utils/numbers", () => {
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
      expect(calculateAverageValue([-120])).toBe(-120);
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

    it("Should throw for zero true value", () => {
      expect(() =>
        calculateDeviationPercent({ measuredValue: 1, trueValue: 0 })
      ).toThrow(
        "Calculating deviation with zero true value would cause division by zero"
      );
    });

    it("Should properly calculate deviation for zero measured value and non-zero true value", () => {
      expect(
        calculateDeviationPercent({ measuredValue: 0, trueValue: 1 })
      ).toBe(100);
    });
  });
});
