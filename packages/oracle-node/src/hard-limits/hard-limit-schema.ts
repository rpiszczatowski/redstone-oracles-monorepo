import { z } from "zod";
import { RedstoneTypes } from "@redstone-finance/utils";

const HardLimitsPerDataFeedSchema = z.object({
  upper: z.number(),
  lower: z.number(),
});

const lastUpdateTimestampSchema = z.object({
  [RedstoneTypes.LAST_UPDATED_TIMESTAMP_SYMBOL]: z.number(),
});

export const HardLimitsSchema = lastUpdateTimestampSchema.catchall(
  HardLimitsPerDataFeedSchema
);
