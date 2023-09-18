import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  roots: ["<rootDir>/"],
  testMatch: ["**/tests/**/?(*.)+(spec).+(ts)"],
  transform: {
    "^.+\\.(ts|js)$": "ts-jest",
  },
  testEnvironment: "node",
  modulePaths: ["<rootDir>"],
};

export default config;
