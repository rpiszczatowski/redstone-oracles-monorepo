import { KaikoV2Fetcher } from "../../src/fetchers/kaiko-v2/KaikoV2Fetcher";
import { mockFetcherResponseOnce } from "./_helpers";

jest.mock("axios");

describe("Kaiko V2 fetcher", () => {
  beforeAll(() => {
    mockFetcherResponseOnce(
      "../../src/fetchers/kaiko-v2/example-response.json"
    );
  });

  it("should properly fetch data with proper tokens", async () => {
    const fetcher = new KaikoV2Fetcher();
    const result = await fetcher.fetchAll(["QI"]);
    expect(result).toEqual([{ symbol: "QI", value: 0.00653 }]);
  });
});
