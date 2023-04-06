import axios from "axios";
import {
  clearPricesTable,
  closeLocalDB,
  setupLocalDb,
} from "../../src/db/local-db";
import fetchers from "../../src/fetchers/index";
import { mockFetcherResponse, saveMockPriceInLocalDb } from "./_helpers";

jest.mock("axios");

describe("kyber fetcher", () => {
  beforeAll(() => {
    setupLocalDb();
  });

  beforeEach(async () => {
    await clearPricesTable();
  });

  afterAll(async () => {
    await closeLocalDB();
  });

  const sut = fetchers["kyber"];

  beforeEach(() => {
    mockFetcherResponse("../../src/fetchers/kyber/example-response.json");
  });

  it("should properly fetch data", async () => {
    await saveMockPriceInLocalDb(2500, "ETH");
    const result = await sut.fetchAll(["MKR", "UNI", "SUSHI"]);
    expect(result).toEqual([
      {
        symbol: "MKR",
        value: 3387.053316881745,
      },
      {
        symbol: "UNI",
        value: 25.728675847614895,
      },
      {
        symbol: "SUSHI",
        value: 11.281276604715393,
      },
    ]);
  });
});
