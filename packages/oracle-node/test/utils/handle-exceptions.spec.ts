import { handleExceptions } from "../../src/utils/handle-exceptions";
import { getComplicatedFunction } from "./helpers";

describe("handleExceptions", () => {
  test("should handle failed promise", async () => {
    let count = 0;
    const promiseWhichFailsThenSucceed = jest.fn(() => {
      if (count === 0) {
        count += 1;
        return Promise.reject({ stack: "Rejected" });
      } else {
        return Promise.resolve();
      }
    });

    const complicatedFunction = getComplicatedFunction(
      promiseWhichFailsThenSucceed
    );

    await handleExceptions(complicatedFunction);
    expect(promiseWhichFailsThenSucceed).toHaveBeenCalledTimes(2);
  });

  test("should handle uncaught exception", async () => {
    let count = 0;
    const testObject = {
      existingObject: { test: 123 },
    };
    const functionWithException = jest.fn(() => {
      if (count === 0 || count === 1) {
        count += 1;
        return (testObject as any).nonExistingKey.test;
      } else {
        return testObject.existingObject.test;
      }
    });

    const complicatedFunction = getComplicatedFunction(functionWithException);

    await handleExceptions(complicatedFunction);
    expect(functionWithException).toHaveBeenCalledTimes(3);
  });

  test("should handle before exit event", async () => {
    const testFunction = jest.fn(() => {
      return Promise.resolve();
    });

    const complicatedFunction = getComplicatedFunction(testFunction);

    await handleExceptions(complicatedFunction);
    expect(testFunction).toHaveBeenCalledTimes(1);
  });
});
