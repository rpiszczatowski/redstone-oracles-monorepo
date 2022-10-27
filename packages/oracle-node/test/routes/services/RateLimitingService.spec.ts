import {
  recordRequestSentByAddress,
  getRecordedAddresses,
  hasAddressReachedRateLimit,
  clearRecordedAddresses,
} from "../../../src/routes/services/RateLimitingService";

jest.useFakeTimers();

const mockTimestamp = 1666082293466;
const NINETY_MINUTES_IN_MILLISECONDS = 90 * 60 * 1000;
const SEVENTY_MINUTES_IN_MILLISECONDS = 70 * 60 * 1000;
const TEN_MINUTES_IN_MILLISECONDS = 10 * 60 * 1000;
const mockAddress = "0x535c835378B890061f96D7ea678a7b05EdC5007A";
const testLimitedAddress = {
  [mockAddress]: {
    timestamps: [mockTimestamp],
  },
};

describe("RateLimitingService", () => {
  beforeEach(() => {
    jest.setSystemTime(mockTimestamp);
  });

  test("Should add new address to recorded addresses", () => {
    recordRequestNtimes(1);
    expect(getRecordedAddresses()).toEqual(testLimitedAddress);
  });

  test("Should not remove address timestamps from recorded if requested before one hour", () => {
    recordRequestNtimes(1);
    jest.setSystemTime(mockTimestamp + TEN_MINUTES_IN_MILLISECONDS);
    recordRequestNtimes(1, true);
    expect(getRecordedAddresses()).toEqual({
      [mockAddress]: {
        timestamps: [
          mockTimestamp,
          mockTimestamp + TEN_MINUTES_IN_MILLISECONDS,
        ],
      },
    });
  });

  test("Should remove address timestamp from recorded if requested after one hour", () => {
    recordRequestNtimes(1);
    jest.setSystemTime(mockTimestamp + SEVENTY_MINUTES_IN_MILLISECONDS);
    recordRequestNtimes(1, true);
    expect(getRecordedAddresses()).toEqual({
      [mockAddress]: {
        timestamps: [mockTimestamp + SEVENTY_MINUTES_IN_MILLISECONDS],
      },
    });
  });

  test("Should address have access if requested first time", () => {
    recordRequestNtimes(1);
    expect(hasAddressReachedRateLimit(mockAddress)).toEqual(false);
  });

  test("Should address have access if requested less times than max", () => {
    recordRequestNtimes(2);
    expect(hasAddressReachedRateLimit(mockAddress)).toEqual(false);
  });

  test("Should address have access if requested before one hour and less times than max", () => {
    recordRequestNtimes(1);
    jest.setSystemTime(mockTimestamp + TEN_MINUTES_IN_MILLISECONDS);
    recordRequestNtimes(3, true);
    expect(hasAddressReachedRateLimit(mockAddress)).toEqual(false);
  });

  test("Should address have access if requested more than max times but in more than one hour", () => {
    recordRequestNtimes(4);
    jest.setSystemTime(mockTimestamp + NINETY_MINUTES_IN_MILLISECONDS);
    recordRequestNtimes(4, true);
    expect(hasAddressReachedRateLimit(mockAddress)).toEqual(false);
  });

  test("Should address have access if requested max times", () => {
    recordRequestNtimes(5);
    expect(hasAddressReachedRateLimit(mockAddress)).toEqual(true);
  });

  test("Shouldn't address have access if requested more times than max", () => {
    recordRequestNtimes(6);
    expect(hasAddressReachedRateLimit(mockAddress)).toEqual(true);
  });

  afterEach(() => {
    jest.setSystemTime(mockTimestamp);
    clearRecordedAddresses();
  });
});

const recordRequestNtimes = (
  numberOfRequests: number,
  passCurrentTime: boolean = false
) => {
  [...Array(numberOfRequests).keys()].forEach((key) => {
    const timestamp = passCurrentTime ? Date.now() : mockTimestamp;
    recordRequestSentByAddress(
      mockAddress,
      key * TEN_MINUTES_IN_MILLISECONDS + timestamp
    );
  });
};
