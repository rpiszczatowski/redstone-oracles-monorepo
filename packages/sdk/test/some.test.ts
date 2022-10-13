import { getOracleRegistryState } from "../src";

describe("Sample test", () => {
  test("Should pass", async () => {
    expect(2 + 2).toBe(4);
  });

  test("Should properly get oracle registry state", async () => {
    const state = getOracleRegistryState();
    console.log(state);
  });
});
