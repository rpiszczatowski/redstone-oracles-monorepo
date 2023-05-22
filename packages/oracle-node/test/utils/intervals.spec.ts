import { intervalMsToCronFormat } from "../../src/utils/intervals";

jest.mock("../../src/Terminator", () => ({
  terminateWithManifestConfigError: (details: string) => {
    throw new Error(`Terminate mock manifest config error: ${details}`);
  },
}));

describe("interval", () => {
  describe("intervalToCronFormat", () => {
    it("should convert to CronFormat when interval equals 1 second", () => {
      const interval = 1000;
      expect(intervalMsToCronFormat(interval)).toEqual("*/1 * * * * *");
    });

    it("should convert to CronFormat when interval smaller than 1 minute", () => {
      const interval = 5000;
      expect(intervalMsToCronFormat(interval)).toEqual("*/5 * * * * *");
    });

    it("should throw if interval not divisble by 1000 and interval smaller than 1 minute", () => {
      const interval = 5500;
      expect(() => intervalMsToCronFormat(interval)).toThrowError(
        "Terminate mock manifest config error: Interval needs to be divisible by 1000"
      );
    });

    it("should convert to CronFormat when interval equals 1 minute", () => {
      const interval = 60000;
      expect(intervalMsToCronFormat(interval)).toEqual("*/1 * * * *");
    });

    it("should convert to CronFormat when interval is greater than 1 minute and smaller than 60 minutes", () => {
      const interval = 60000 * 30;
      expect(intervalMsToCronFormat(interval)).toEqual("*/30 * * * *");
    });

    it("should throw if interval not divisble by 60000 and interval smaller than 1 hour", () => {
      const interval = 60000 * 30 + 1000;
      expect(() => intervalMsToCronFormat(interval)).toThrowError(
        "Terminate mock manifest config error: If interval is greater than 60 seconds it must to be multiple of 1 minute"
      );
    });

    it("should convert to CronFormat when interval equals 1 hour", () => {
      const interval = 1000 * 60 * 60;
      expect(intervalMsToCronFormat(interval)).toEqual("*/1 * * *");
    });

    it("should throw if interval greater than 1 hour", () => {
      const interval = 1000 * 60 * 60 + 60000;
      expect(() => intervalMsToCronFormat(interval)).toThrowError(
        "Terminate mock manifest config error: Intervals greater than 1 hour are not supported"
      );
    });
  });
});
