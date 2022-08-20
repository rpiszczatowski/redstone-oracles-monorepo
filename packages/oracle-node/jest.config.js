module.exports = {
  roots: ["<rootDir>/"],
  testMatch: ["**/test/**/?(*.)+(spec).+(ts)"],
  transform: {
    "^.+\\.(ts|js)$": "ts-jest",
  },
  testEnvironment: "node",
  setupFiles: ["<rootDir>/.jest/setEnvVars.js"],
};
