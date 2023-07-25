import { validateManifest } from "../../src/manifest/validate-manifest";
import { Manifest } from "../../src/types";
import {
  buildInvalidValuesManifests,
  correctManifest,
  deviationCheckErrors,
  getDefaultErrors,
  manifestsWithInvalidDeviationCheckConfig,
  tokensErrors,
} from "./helpers";

jest.mock("../../src/Terminator.ts", () => ({
  terminateWithManifestConfigError: (details: string) => {
    throw new Error(`Mock manifest config termination: ${details}`);
  },
}));

describe("validate-manifest", () => {
  test("should throw error if defaultSource is not array of strings", () => {
    const manifests = buildInvalidValuesManifests("defaultSource");
    const errors = getDefaultErrors("array");
    manifests.forEach((manifest, index) =>
      expect(() => validateManifest(manifest)).toThrowError(
        `Invalid manifest configuration - defaultSource: ${errors[index]}`
      )
    );
  });

  test("should throw error if interval is not a number", () => {
    const manifests = buildInvalidValuesManifests("interval");
    const errors = getDefaultErrors("number");
    manifests.forEach((manifest, index) =>
      expect(() => validateManifest(manifest)).toThrowError(
        `Invalid manifest configuration - interval: ${errors[index]}`
      )
    );
  });

  test("should throw error if priceAggregator is invalid value", () => {
    const manifests = buildInvalidValuesManifests("priceAggregator");
    manifests.forEach((manifest, index) =>
      expect(() => validateManifest(manifest)).toThrowError(
        "Invalid manifest configuration - priceAggregator: Invalid input"
      )
    );
  });

  test("should throw error if sourceTimeout is not a number", () => {
    const manifests = buildInvalidValuesManifests("sourceTimeout");
    const errors = getDefaultErrors("number");
    manifests.forEach((manifest, index) =>
      expect(() => validateManifest(manifest)).toThrowError(
        `Invalid manifest configuration - sourceTimeout: ${errors[index]}`
      )
    );
  });

  test("should throw error if deviationCheck has wrong configuration", () => {
    manifestsWithInvalidDeviationCheckConfig.forEach((manifest, index) =>
      expect(() => validateManifest(manifest)).toThrowError(
        `Invalid manifest configuration - ${deviationCheckErrors[index]}`
      )
    );
  });

  test("should throw error if tokens has length zero", () => {
    const manifests = [
      ...buildInvalidValuesManifests("tokens"),
      { ...correctManifest, tokens: 123 },
      { ...correctManifest, tokens: [] },
    ] as Manifest[];
    manifests.forEach((manifest, index) =>
      expect(() => validateManifest(manifest)).toThrowError(
        `Invalid manifest configuration - tokens: ${tokensErrors[index]}`
      )
    );
  });

  test("should not throw error if manifest is correct", () => {
    validateManifest(correctManifest);
  });

  test("should throw if interval not divisible by 1000 and interval smaller than 1 minute", () => {
    const interval = 5500;
    const manifest = { ...correctManifest, interval };
    expect(() => validateManifest(manifest)).toThrowError(
      "Invalid manifest configuration - interval: Number must be a multiple of 1000"
    );
  });

  test("should throw if interval not divisible by 60000 and interval smaller than 1 hour", () => {
    const interval = 60000 * 30 + 1000;
    const manifest = { ...correctManifest, interval };
    expect(() => validateManifest(manifest)).toThrowError(
      "Invalid manifest configuration - interval: If interval is greater than 60 seconds it must to be multiple of 1 minute"
    );
  });

  test("should throw if interval greater than 1 hour", () => {
    const interval = 1000 * 60 * 60 + 60000;
    const manifest = { ...correctManifest, interval };
    expect(() => validateManifest(manifest)).toThrowError(
      "Invalid manifest configuration - interval: Number must be less than or equal to 3600000"
    );
  });
});
