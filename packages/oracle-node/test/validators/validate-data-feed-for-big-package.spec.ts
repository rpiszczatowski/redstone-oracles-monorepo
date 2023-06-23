import { validateDataPointsForBigPackage } from "../../src/validators/validate-data-feed-for-big-package";
import { mockDataPoints, mockTokenConfig } from "./helpers";

describe("validateDataPointsForBigPackage", () => {
  test("return false if not enough data points", () => {
    const areEnoughDataPoint = validateDataPointsForBigPackage(
      mockDataPoints.slice(0, 1),
      mockTokenConfig
    );
    expect(areEnoughDataPoint).toBe(false);
  });

  test("return true if not enough data points with signing", () => {
    const newMockTokenConfig = {
      ...mockTokenConfig,
      BTC: { skipSigning: true },
    };
    const areEnoughDataPoint = validateDataPointsForBigPackage(
      mockDataPoints.slice(3),
      newMockTokenConfig
    );
    expect(areEnoughDataPoint).toBe(false);
  });

  test("return true if number data points exactly how is required", () => {
    const areEnoughDataPoint = validateDataPointsForBigPackage(
      mockDataPoints.slice(0, 2),
      mockTokenConfig
    );
    expect(areEnoughDataPoint).toBe(true);
  });

  test("return true if more data points than required", () => {
    const areEnoughDataPoint = validateDataPointsForBigPackage(
      mockDataPoints,
      mockTokenConfig
    );
    expect(areEnoughDataPoint).toBe(true);
  });

  test("return true if enough data points with signing", () => {
    const newMockTokenConfig = {
      ...mockTokenConfig,
      BTC: { skipSigning: true },
      AR: { skipSigning: true },
    };
    const areEnoughDataPoint = validateDataPointsForBigPackage(
      mockDataPoints.slice(1),
      newMockTokenConfig
    );
    expect(areEnoughDataPoint).toBe(true);
  });

  test("return false if all tokens are with skipping singing", () => {
    const newMockTokenConfig = {
      ...mockTokenConfig,
      BTC: { skipSigning: true },
      ETH: { skipSigning: true },
      AR: { skipSigning: true },
      AVAX: { skipSigning: true },
    };
    const areEnoughDataPoint = validateDataPointsForBigPackage(
      mockDataPoints,
      newMockTokenConfig
    );
    expect(areEnoughDataPoint).toBe(false);
  });
});
