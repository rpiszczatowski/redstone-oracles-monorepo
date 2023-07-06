import {
  NotSanitizedPriceDataBeforeAggregation,
  PriceDataAfterAggregation,
  SanitizedPriceDataBeforeAggregation,
} from "../../src/types";
import medianAggregator from "../../src/aggregators/median-aggregator";
import { SafeNumber } from "redstone-utils";

describe("medianAggregator", () => {
  it("should properly aggregate prices from different sources", () => {
    // Given
    const input: SanitizedPriceDataBeforeAggregation = {
      id: "",
      source: {
        src1: SafeNumber.createSafeNumber(3),
        src2: SafeNumber.createSafeNumber(7),
        src3: SafeNumber.createSafeNumber(2),
        src4: SafeNumber.createSafeNumber(6),
        src5: SafeNumber.createSafeNumber(5),
        src6: SafeNumber.createSafeNumber(9),
        src7: SafeNumber.createSafeNumber(8),
      },
      symbol: "BTC",
      timestamp: 0,
      version: "",
      sourceMetadata: {},
    };

    // When
    const result: PriceDataAfterAggregation =
      medianAggregator.getAggregatedValue(input);

    // Then
    expect(result.value.toString()).toEqual("6");
  });
});
