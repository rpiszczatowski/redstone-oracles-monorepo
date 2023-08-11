import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  roots: ["<rootDir>/"],
  testMatch: ["**/test/**/?(*.)+(spec).+(ts)"],
  transform: {
    "^.+\\.(ts|js)$": "ts-jest",
  },
  testEnvironment: "node",
  modulePaths: ["<rootDir>"],
  setupFiles: ["<rootDir>/.jest/set-env-vars.js"],
  testPathIgnorePatterns: ["<rootDir>/test/dry-run/*"],
  // https://stackoverflow.com/questions/73203367/jest-syntaxerror-unexpected-token-export-with-uuid-library
  moduleNameMapper: { "^uuid$": "uuid" },
};

export default config;
