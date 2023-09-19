import { IScheduler, IterationContext } from "./IScheduler";
import { intervalMsToCronFormat } from "../utils/intervals";
import { roundTimestamp } from "../utils/timestamps";
import schedule from "node-schedule";

export class CronScheduler implements IScheduler {
  constructor(private timestampMillisecondsInterval: number) {}

  async startIterations(
    runIterationFn: (context: IterationContext) => Promise<void>
  ) {
    // TODO: think about removing it later as it is not consistent with the cron approach
    await runIterationFn({
      timestamp: roundTimestamp(Date.now()),
    });

    const cronScheduleString = intervalMsToCronFormat(
      this.timestampMillisecondsInterval
    );
    schedule.scheduleJob(cronScheduleString, async () => {
      await runIterationFn({
        timestamp: roundTimestamp(Date.now()),
      });
    });
  }
}
