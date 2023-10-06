import { fetchHardLimitsForDataFeeds } from "../../src/hard-limits/fetch-hard-limits-for-data-feeds";
import {
  server,
  validResponse,
  mockedTimestamp,
  urls,
  secondValid,
  thirdValid,
  firstOutdated,
  allInvalid,
} from "./mock-server";

describe("fetchHardLimitsForDataFeeds", () => {
  beforeAll(() => {
    jest.useFakeTimers({ now: mockedTimestamp });
    server.listen();
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  const runFetchHardLimitsTest = async () => {
    const result = await fetchHardLimitsForDataFeeds(urls);
    expect(result).toStrictEqual(validResponse);
  };

  test("should fetch hard limits from first url", async () => {
    await runFetchHardLimitsTest();
  });

  test("should fetch hard limits from second url if first failed", async () => {
    server.use(...secondValid);
    await runFetchHardLimitsTest();
  });

  test("should fetch hard limits from third url if first and second failed", async () => {
    server.use(...thirdValid);
    await runFetchHardLimitsTest();
  });

  test("should fetch hard limits from second url if first returned outdated", async () => {
    server.use(...firstOutdated);
    await runFetchHardLimitsTest();
  });

  test("should throw error if all url failed", async () => {
    server.use(...allInvalid);
    await expect(() => fetchHardLimitsForDataFeeds(urls)).rejects.toThrowError(
      `Failed to fetch hard limits from ${urls.join(", ")} urls`
    );
  });
});
