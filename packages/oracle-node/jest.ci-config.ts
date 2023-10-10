import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  roots: ["<rootDir>/"],
  testMatch: [
    "<rootDir>/test/dry-run/?(*.)+(spec).+(ts)",
    "<rootDir>/test/sources-consistency/?(*.)+(spec).+(ts)",
  ],
  transform: {
    "^.+\\.(ts|js)$": "ts-jest",
  },
  testEnvironment: "node",
  setupFiles: ["<rootDir>/.jest/set-env-vars.js"],
};

export default config;
