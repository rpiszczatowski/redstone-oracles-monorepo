import {
  safelyConvertAnyValueToNumber,
  calculateSum,
  calculateAverageValue,
  calculateDeviationPercent,
} from "../../src/utils/numbers";
import { SafeNumber } from "../../src/numbers/SafeNumberFactory";

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
      expect(calculateSum([]).toString()).toBe("0");
    });

    it("Should properly calculate sum for 1-elem array", () => {
      expect(calculateSum([SafeNumber(42)]).toString()).toBe("42");
    });

    it("Should properly calculate sum for 3-elem array", () => {
      expect(calculateSum([42, 100, 1000].map(SafeNumber)).toString()).toBe(
        "1142"
      );
    });

    it("Should properly calculate sum for a big array", () => {
      const bigArr = Array(2000).fill(120000);
      expect(calculateSum(bigArr).toString()).toBe((120000 * 2000).toString());
    });
  });

  describe("calculateAverageValue", () => {
    it("Should properly calculate an average value for 1-elem arrays", () => {
      expect(calculateAverageValue([SafeNumber(42)]).toString()).toBe("42");
      expect(calculateAverageValue([SafeNumber(142)]).toString()).toBe("142");
      expect(calculateAverageValue([SafeNumber(120)]).toString()).toBe("120");
    });

    it("Should properly calculate an average value for a 3-elem array", () => {
      expect(
        calculateAverageValue([42, 44, 43].map(SafeNumber)).toString()
      ).toBe("43");
    });

    it("Should properly calculate an average value for a big array", () => {
      const bigArr = Array(2000).fill(SafeNumber(1121315));
      expect(calculateAverageValue(bigArr).toString()).toBe("1121315");
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
        calculateDeviationPercent({
          measuredValue: SafeNumber(10.5),
          trueValue: SafeNumber(10.5),
        }).toString()
      ).toBe("0");
    });

    it("Should properly calculate big deviations", () => {
      expect(
        calculateDeviationPercent({
          measuredValue: SafeNumber(1),
          trueValue: SafeNumber(10),
        }).toString()
      ).toBe("90");

      expect(
        calculateDeviationPercent({
          measuredValue: SafeNumber(10),
          trueValue: SafeNumber(1),
        }).toString()
      ).toBe("900");
    });

    it("Should properly calculate deviation with a negative value", () => {
      expect(
        calculateDeviationPercent({
          measuredValue: SafeNumber(-42),
          trueValue: SafeNumber(42),
        }).toString()
      ).toBe("200");
    });

    it("Should work with zero value", () => {
      expect(
        calculateDeviationPercent({
          measuredValue: SafeNumber(1),
          trueValue: SafeNumber(0),
        }).unsafeToNumber()
      ).toBeGreaterThan(2 ** 40); // some big number depends on implementation of N
    });

    it("Should properly calculate deviation for zero measured value and non-zero true value", () => {
      expect(
        calculateDeviationPercent({
          measuredValue: SafeNumber(0),
          trueValue: SafeNumber(1),
        }).toString()
      ).toBe("100");
    });
  });
});
