import axios from "axios";
import fetchers from "../../src/fetchers/index";
import { saveMockPriceInLocalDb } from "./_helpers";
import {
  setupLocalDb,
  clearPricesSublevel,
  closeLocalLevelDB,
} from "../../src/db/local-db";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("API fetcher", () => {
  beforeAll(() => {
    setupLocalDb();
  });

  beforeEach(async () => {
    await clearPricesSublevel();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  test("kucoin api", async () => {
    const exampleResponse = {
      code: "200000",
      data: {
        time: 1695230124897,
        sequence: "153275046",
        price: "4.8818",
        size: "20.4633",
        bestBid: "4.8702",
        bestBidSize: "11.3225",
        bestAsk: "4.8819",
        bestAskSize: "15292.1391",
      },
    };
    mockedAxios.get.mockResolvedValue({ data: exampleResponse });
    await saveMockPriceInLocalDb(0.99, "USDT");

    const fetcher = fetchers["kucoin-api"]!;
    const result = await fetcher.fetchAll(["BRL"]);

    expect(result).toEqual([
      {
        symbol: "BRL",
        value: 0.20691159205641568,
      },
    ]);
  });

  test("mercado api", async () => {
    const exampleResponse = [
      {
        pair: "USDT-BRL",
        high: "5.04970000",
        low: "4.78017225",
        vol: "139919.74665526",
        last: "4.94761413",
        buy: "4.94076002",
        sell: "4.94514788",
        open: "4.87499999",
        date: 1695306279,
      },
    ];
    mockedAxios.get.mockResolvedValue({ data: exampleResponse });
    await saveMockPriceInLocalDb(0.99, "USDT");

    const fetcher = fetchers["mercado-api"]!;
    const result = await fetcher.fetchAll(["BRL"]);

    expect(result).toEqual([
      {
        symbol: "BRL",
        value: 0.2041592136250549,
      },
    ]);
  });

  test("binance api", async () => {
    const exampleResponse = {
      symbol: "USDTBRL",
      price: "4.94300000",
    };
    mockedAxios.get.mockResolvedValue({ data: exampleResponse });
    await saveMockPriceInLocalDb(0.99, "USDT");

    const fetcher = fetchers["binance-api"]!;
    const result = await fetcher.fetchAll(["BRL"]);

    expect(result).toEqual([
      {
        symbol: "BRL",
        value: 0.2043497896218916,
      },
    ]);
  });

  test("bitso api", async () => {
    const exampleResponse = {
      success: true,
      payload: {
        high: "4.9537",
        last: "4.9424",
        created_at: "2023-09-21T14:25:43+00:00",
        book: "usd_brl",
        volume: "687980.10293147",
        vwap: "4.8939458385",
        low: "4.8696",
        ask: "4.9424",
        bid: "4.9386",
        change_24: "0.0621",
        rolling_average_change: {
          "6": "0.1693",
        },
      },
    };
    mockedAxios.get.mockResolvedValue({ data: exampleResponse });

    const fetcher = fetchers["bitso-api"]!;
    const result = await fetcher.fetchAll(["BRL"]);

    expect(result).toEqual([
      {
        symbol: "BRL",
        value: 0.20233085140822274,
      },
    ]);
  });

  test("coinbase api", async () => {
    const exampleResponse = {
      data: {
        amount: "1.0659439093208622",
        base: "EUR",
        currency: "USD",
      },
    };
    mockedAxios.get.mockResolvedValue({ data: exampleResponse });

    const fetcher = fetchers["coinbase-api"]!;
    const result = await fetcher.fetchAll(["EUR"]);

    expect(result).toEqual([
      {
        symbol: "EUR",
        value: 1.0659439093208622,
      },
    ]);
  });

  test("bitstamp api", async () => {
    const exampleResponse = {
      timestamp: "1695306379",
      open: "1.06530",
      high: "1.07356",
      low: "1.06233",
      last: "1.06644",
      volume: "1235329.39579",
      vwap: "1.06871",
      bid: "1.06628",
      ask: "1.06645",
      side: "0",
      open_24: "1.07171",
      percent_change_24: "-0.49",
    };
    mockedAxios.get.mockResolvedValue({ data: exampleResponse });

    const fetcher = fetchers["bitstamp-api"]!;
    const result = await fetcher.fetchAll(["EUR"]);

    expect(result).toEqual([
      {
        symbol: "EUR",
        value: 1.06644,
      },
    ]);
  });

  test("should return empty array if price from response is undefined", async () => {
    const exampleResponse = {
      last: undefined,
    };
    mockedAxios.get.mockResolvedValue({ data: exampleResponse });

    const fetcher = fetchers["bitstamp-api"]!;
    const result = await fetcher.fetchAll(["EUR"]);
    expect(result).toEqual([]);
  });

  test("should return empty array if price from response is empty string", async () => {
    const exampleResponse = {
      last: "",
    };
    mockedAxios.get.mockResolvedValue({ data: exampleResponse });

    const fetcher = fetchers["bitstamp-api"]!;
    const result = await fetcher.fetchAll(["EUR"]);
    expect(result).toEqual([]);
  });

  test("should return empty array if price from response is non numeric value", async () => {
    const exampleResponse = {
      last: "453tgds43q4",
    };
    mockedAxios.get.mockResolvedValue({ data: exampleResponse });

    const fetcher = fetchers["bitstamp-api"]!;
    const result = await fetcher.fetchAll(["EUR"]);
    expect(result).toEqual([]);
  });
});
