import { validateDataPointsForBigPackage } from "../../src/validators/validate-data-feed-for-big-package";
import { mockDataPoints } from "./helpers";

describe("validateDataPointsForBigPackage", () => {
  test("throw error if no manifest", () => {
    expect(() => validateDataPointsForBigPackage([], undefined)).toThrowError(
      "Cannot get token count from manifest"
    );
  });

  test("return false if not enough data points", () => {
    const areEnoughDataPoint = validateDataPointsForBigPackage(
      mockDataPoints.slice(0, 1),
      4
    );
    expect(areEnoughDataPoint).toBe(false);
  });

  test("return true if number data points exactly how is required", () => {
    const areEnoughDataPoint = validateDataPointsForBigPackage(
      mockDataPoints.slice(0, 2),
      4
    );
    expect(areEnoughDataPoint).toBe(true);
  });

  test("return true if more data points than required", () => {
    const areEnoughDataPoint = validateDataPointsForBigPackage(
      mockDataPoints,
      4
    );
    expect(areEnoughDataPoint).toBe(true);
  });
});
