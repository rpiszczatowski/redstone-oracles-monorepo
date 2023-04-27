import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  roots: ["<rootDir>/"],
  testMatch: ["**/test/**/?(*.)+(spec).+(ts)"],
  transform: {
    "^.+\\.(ts|js)$": "ts-jest",
  },
  testEnvironment: "node",
  setupFiles: ["<rootDir>/.jest/set-env-vars.js"],
  testPathIgnorePatterns: ["<rootDir>/test/dry-run/*"],
};

export default config;
