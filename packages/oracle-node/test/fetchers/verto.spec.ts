import axios from "axios";
import {
  clearLocalDb,
  closeLocalDB,
  setupLocalDb,
} from "../../src/db/local-db";
import fetchers from "../../src/fetchers/index";
import { mockFetcherResponse, saveMockPriceInLocalDb } from "./_helpers";

jest.mock("axios");

describe("verto fetcher", () => {
  beforeAll(() => {
    setupLocalDb();
  });

  beforeEach(async () => {
    clearLocalDb();
  });

  afterAll(async () => {
    await closeLocalDB();
  });

  const sut = fetchers["verto"];

  beforeEach(() => {
    mockFetcherResponse("../../src/fetchers/verto/example-response.json");
  });

  it("should properly fetch data", async () => {
    await saveMockPriceInLocalDb(10, "AR");

    const result = await sut.fetchAll(["XYZ"]);
    expect(result).toEqual([
      {
        symbol: "XYZ",
        value: 2.5,
      },
    ]);
  });
});
