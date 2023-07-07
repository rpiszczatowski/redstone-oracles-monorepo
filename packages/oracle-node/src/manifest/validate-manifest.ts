import { z } from "zod";
import { terminateWithManifestConfigError } from "../Terminator";
import { Manifest } from "../types";

const ONE_HOUR_IN_MILLISECONDS = 1000 * 60 * 60;
const ONE_MINUTE_IN_MILLISECONDS = 1000 * 60;

const IntervalSchema = z.intersection(
  z.number().positive().multipleOf(1000).max(ONE_HOUR_IN_MILLISECONDS),
  z.custom(
    (interval) =>
      (interval as number) < ONE_MINUTE_IN_MILLISECONDS
        ? true
        : (interval as number) % ONE_MINUTE_IN_MILLISECONDS === 0,
    {
      message:
        "If interval is greater than 60 seconds it must to be multiple of 1 minute",
    }
  )
);

const DeviationCheckSchema = z.object({
  deviationWithRecentValues: z.object({
    maxDelayMilliseconds: z.number(),
    maxPercent: z.number(),
  }),
});

const TokenSchema = z.object({
  source: z.array(z.string()).optional(),
  deviationCheck: z.string().optional(),
  customUrlDetails: z.string().optional(),
  comment: z.string().optional(),
  skipSigning: z.boolean().optional(),
  priceAggregator: z.string().optional(),
});

const ManifestSchema = z.object({
  defaultSource: z.array(z.string()),
  interval: IntervalSchema,
  priceAggregator: z.union([z.literal("median"), z.literal("lwap")]),
  sourceTimeout: z.number().positive(),
  deviationCheck: DeviationCheckSchema,
  tokens: z.record(z.string().min(1), TokenSchema),
});

export const validateManifest = (manifest: Manifest) => {
  const validationResult = ManifestSchema.safeParse(manifest);
  if (!validationResult.success) {
    const errors = validationResult.error.errors;
    const errorsPaths = errors.map(
      ({ path, message }) => `${path.join("/")}: ${message}`
    );
    const uniqueErrorsPathsAsString = errorsPaths.join(", ");
    terminateWithManifestConfigError(
      `Invalid manifest configuration - ${uniqueErrorsPathsAsString}`
    );
  }
};
