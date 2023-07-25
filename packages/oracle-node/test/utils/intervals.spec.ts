import { intervalMsToCronFormat } from "../../src/utils/intervals";

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

    it("should convert to CronFormat when interval equals 1 minute", () => {
      const interval = 60000;
      expect(intervalMsToCronFormat(interval)).toEqual("*/1 * * * *");
    });

    it("should convert to CronFormat when interval is greater than 1 minute and smaller than 60 minutes", () => {
      const interval = 60000 * 30;
      expect(intervalMsToCronFormat(interval)).toEqual("*/30 * * * *");
    });

    it("should convert to CronFormat when interval equals 1 hour", () => {
      const interval = 1000 * 60 * 60;
      expect(intervalMsToCronFormat(interval)).toEqual("*/1 * * *");
    });
  });
});
