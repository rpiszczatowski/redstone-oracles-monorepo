import { validateDataPointsForBigPackage } from "../../src/validators/validate-data-feed-for-big-package";
import { mockDataPoints, mockManifest } from "./helpers";

describe("validateDataPointsForBigPackage", () => {
  test("throw error if no manifest", () => {
    expect(() => validateDataPointsForBigPackage([], undefined)).toThrowError(
      "Cannot get tokens count from manifest, manifest is undefined"
    );
  });

  test("return false if not enough data points", () => {
    const areEnoughDataPoint = validateDataPointsForBigPackage(
      mockDataPoints.slice(0, 1),
      mockManifest
    );
    expect(areEnoughDataPoint).toBe(false);
  });

  test("return true if number data points exactly how is required", () => {
    const areEnoughDataPoint = validateDataPointsForBigPackage(
      mockDataPoints.slice(0, 2),
      mockManifest
    );
    expect(areEnoughDataPoint).toBe(true);
  });

  test("return true if more data points than required", () => {
    const areEnoughDataPoint = validateDataPointsForBigPackage(
      mockDataPoints,
      mockManifest
    );
    expect(areEnoughDataPoint).toBe(true);
  });
});
