import { trackEnd, trackStart } from "../utils/performance-tracker";
import { Consola } from "consola";
const logger = require("./../utils/logger")("BroadcastPerformer") as Consola;

export abstract class BroadcastPerformer {
  async performBroadcast(promises: Promise<any>[], name: string) {
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
    } catch (e: any) {
      if (e.response !== undefined) {
        logger.error(
          `Broadcasting ${name} failed: ` + e.response.data,
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
