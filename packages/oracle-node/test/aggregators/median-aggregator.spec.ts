import {
  PriceDataAfterAggregation,
  SanitizedPriceDataBeforeAggregation,
} from "../../src/types";
import { SafeNumber } from "../../src/numbers/SafeNumberFactory";
import medianAggregator, {
  getMedianValue,
} from "../../src/aggregators/median-aggregator";

describe("getMedianValue", () => {
  it("should throw for empty array", () => {
    expect(() => getMedianValue([])).toThrow();
  });

  it("should properly calculate median for odd number of elements", () => {
    expect(
      getMedianValue([3, 7, 2, 6, 5, 4, 9].map(SafeNumber)).toString()
    ).toEqual("5");
    expect(getMedianValue([-3, 0, 3].map(SafeNumber)).toString()).toEqual("0");
    expect(getMedianValue([3, 0, -3].map(SafeNumber)).toString()).toEqual("0");
    expect(
      getMedianValue([-7, -5, -11, -4, -8].map(SafeNumber)).toString()
    ).toEqual("-7");
  });

  it("should properly calculate median for even number of elements", () => {
    expect(
      getMedianValue([3, 7, 2, 6, 5, 4].map(SafeNumber)).toString()
    ).toEqual("4.5");
    expect(getMedianValue([-3, 0].map(SafeNumber)).toString()).toEqual("-1.5");
    expect(getMedianValue([0, -3].map(SafeNumber)).toString()).toEqual("-1.5");
    expect(getMedianValue([-7, -5, -4, -8].map(SafeNumber)).toString()).toEqual(
      "-6"
    );
  });
});

describe("medianAggregator", () => {
  it("should properly aggregate prices from different sources", () => {
    // Given
    const input: SanitizedPriceDataBeforeAggregation = {
      id: "",
      source: {
        src1: SafeNumber(3),
        src2: SafeNumber(7),
        src3: SafeNumber(2),
        src4: SafeNumber(6),
        src5: SafeNumber(5),
        src6: SafeNumber(9),
        src7: SafeNumber(8),
      },
      symbol: "BTC",
      timestamp: 0,
      version: "",
    };

    // When
    const result: PriceDataAfterAggregation =
      medianAggregator.getAggregatedValue(input);

    // Then
    expect(result.value.toString()).toEqual("6");
  });
});
