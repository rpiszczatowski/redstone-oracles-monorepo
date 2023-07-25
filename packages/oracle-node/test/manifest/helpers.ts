import { Manifest } from "../../src/types";

export const correctManifest: Manifest = {
  interval: 1000,
  defaultSource: ["defaultSource"],
  priceAggregator: "median",
  sourceTimeout: 1,
  deviationCheck: {
    deviationWithRecentValues: {
      maxPercent: 1,
      maxDelayMilliseconds: 1,
    },
  },
  tokens: {
    testToken: { source: ["testSource"] },
  },
};

const buildDeviationCheckConfig = (config: Record<string, any>) => ({
  deviationCheck: { deviationWithRecentValues: config },
});

export const manifestsWithInvalidDeviationCheckConfig = [
  { ...correctManifest, ...buildDeviationCheckConfig({}) },
  {
    ...correctManifest,
    ...buildDeviationCheckConfig({ maxDelayMilliseconds: 1 }),
  },
  {
    ...correctManifest,
    ...buildDeviationCheckConfig({ maxPercent: 1 }),
  },
  {
    ...correctManifest,
    ...buildDeviationCheckConfig({
      maxDelayMilliseconds: "1",
      maxPercent: 1,
    }),
  },
  {
    ...correctManifest,
    ...buildDeviationCheckConfig({
      maxDelayMilliseconds: 1,
      maxPercent: null,
    }),
  },
] as Manifest[];

export const buildInvalidValuesManifests = (fieldName: string) =>
  [
    { ...correctManifest, [fieldName]: undefined },
    { ...correctManifest, [fieldName]: null },
    { ...correctManifest, [fieldName]: "1234" },
    { ...correctManifest, [fieldName]: NaN },
    { ...correctManifest, [fieldName]: "wrong-value" },
  ] as Manifest[];

export const getDefaultErrors = (requiredType: string) => [
  "Required",
  `Expected ${requiredType}, received null`,
  `Expected ${requiredType}, received string`,
  `Expected ${requiredType}, received nan`,
  `Expected ${requiredType}, received string`,
];

export const deviationCheckErrors = [
  "deviationCheck/deviationWithRecentValues/maxDelayMilliseconds: Required, deviationCheck/deviationWithRecentValues/maxPercent: Required",
  "deviationCheck/deviationWithRecentValues/maxPercent: Required",
  "deviationCheck/deviationWithRecentValues/maxDelayMilliseconds: Required",
  "deviationCheck/deviationWithRecentValues/maxDelayMilliseconds: Expected number, received string",
  "deviationCheck/deviationWithRecentValues/maxPercent: Expected number, received null",
];

export const tokensErrors = [
  ...getDefaultErrors("object"),
  "Expected object, received number",
  "Expected object, received array",
];
