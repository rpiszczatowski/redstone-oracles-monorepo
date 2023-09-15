import { trackEnd, trackStart } from "../utils/performance-tracker";
import loggerFactory from "../utils/logger";
import { AxiosError } from "axios";

const logger = loggerFactory("BroadcastPerformer");

export abstract class BroadcastPerformer {
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  async performBroadcast(promises: Promise<void>[], name: string) {
    logger.info(`Broadcasting ${name}`);
    const broadcastingTrackingId = trackStart("broadcasting");
    try {
      const results = await Promise.allSettled(promises);

      // Check if all promises resolved
      const rejectedBroadcasterCount = results.filter(
        (res) => res.status === "rejected"
      ).length;
      if (rejectedBroadcasterCount > 0) {
        throw new Error(
          `${rejectedBroadcasterCount} ${name}-broadcasters failed`
        );
      }

      logger.info(`Broadcasting ${name} completed`);
    } catch (err) {
      const e = err as AxiosError;
      if (e.response !== undefined) {
        logger.error(
          `Broadcasting ${name} failed: ` + String(e.response.data),
          e.stack
        );
      } else {
        logger.error(`Broadcasting ${name} failed`, e.stack);
      }
    } finally {
      trackEnd(broadcastingTrackingId);
    }
  }
}
