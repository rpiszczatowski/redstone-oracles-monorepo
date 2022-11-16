import { db } from "../../src/db/local-db";

describe("Local DB", () => {
  it("should properly put and get data", async () => {
    const testKey = "test-key";
    const testValue = JSON.stringify([{ testValue: 42 }, { testValue: 43 }]);
    db.put(testKey, testValue);
    const receivedValue = await db.get(testKey);
    expect(receivedValue).toBe(testValue);
  });
});
