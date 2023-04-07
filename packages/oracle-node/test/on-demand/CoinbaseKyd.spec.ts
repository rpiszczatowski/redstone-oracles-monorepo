import axios from "axios";
import { saveMockPriceInLocalDb } from "../fetchers/_helpers";
import { determineAddressLevelByCoinbaseData } from "../../src/on-demand/CoinbaseKyd";
import * as CoinbaseKyd from "../../src/on-demand/CoinbaseKyd";
import exampleResponse from "./example-response.json";
import {
  getMultipliedResponse,
  getRateLimitedResponse,
  getResponseWithOuterTransaction,
  getSlicedResponseWithOuterTransaction,
} from "./helpers";
import {
  clearLocalDb,
  closeLocalDB,
  setupLocalDb,
} from "../../src/db/local-db";
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const EXAMPLE_ADDRESS = "0x473780deaf4a2ac070bbba936b0cdefe7f267dfc";
(CoinbaseKyd as any).RETRY_INTERVAL = 10;

describe("Coinbase KYD", () => {
  beforeAll(() => {
    setupLocalDb();
  });

  afterAll(async () => {
    await closeLocalDB();
  });

  describe("determineAddressLevelByCoinbaseData", () => {
    beforeEach(async () => {
      clearLocalDb();
    });

    test("should return level 3", async () => {
      await saveMockPriceInLocalDb(1165.69, "ETH");
      mockedAxios.get.mockResolvedValueOnce({ data: exampleResponse });
      const addressLevel = await determineAddressLevelByCoinbaseData(
        EXAMPLE_ADDRESS
      );
      expect(addressLevel).toBe(3);
    });

    test("should return level 2", async () => {
      await saveMockPriceInLocalDb(1165.69, "ETH");
      const mockedResponse = getResponseWithOuterTransaction();
      mockedAxios.get.mockResolvedValueOnce({
        data: mockedResponse,
      });
      const addressLevel = await determineAddressLevelByCoinbaseData(
        EXAMPLE_ADDRESS
      );
      expect(addressLevel).toBe(2);
    });

    test("should return level 1", async () => {
      await saveMockPriceInLocalDb(1165.69, "ETH");
      const mockedResponse = getSlicedResponseWithOuterTransaction();
      mockedAxios.get.mockResolvedValueOnce({
        data: mockedResponse,
      });
      const addressLevel = await determineAddressLevelByCoinbaseData(
        EXAMPLE_ADDRESS
      );
      expect(addressLevel).toBe(1);
    });

    test("should handle pagination and return level 3", async () => {
      await saveMockPriceInLocalDb(1165.69, "ETH");
      const multipliedResponse = getMultipliedResponse();
      mockedAxios.get
        .mockResolvedValueOnce({
          data: { result: multipliedResponse },
        })
        .mockResolvedValueOnce({
          data: exampleResponse,
        });
      const addressLevel = await determineAddressLevelByCoinbaseData(
        EXAMPLE_ADDRESS
      );
      expect(addressLevel).toBe(3);
    });

    test("should handle pagination and return level 2", async () => {
      await saveMockPriceInLocalDb(1165.69, "ETH");
      const multipliedResponse = getMultipliedResponse();
      const mockedResponse = getResponseWithOuterTransaction();
      mockedAxios.get
        .mockResolvedValueOnce({
          data: { result: multipliedResponse },
        })
        .mockResolvedValueOnce({
          data: mockedResponse,
        });
      const addressLevel = await determineAddressLevelByCoinbaseData(
        EXAMPLE_ADDRESS
      );
      expect(addressLevel).toBe(2);
    });

    test("should refetch transactions when request rate limited", async () => {
      await saveMockPriceInLocalDb(1165.69, "ETH");
      const rateLimitedResponse = getRateLimitedResponse();
      const mockedResponse = getResponseWithOuterTransaction();
      mockedAxios.get
        .mockResolvedValueOnce({
          data: rateLimitedResponse,
        })
        .mockResolvedValueOnce({
          data: rateLimitedResponse,
        })
        .mockResolvedValueOnce({
          data: mockedResponse,
        });
      const addressLevel = await determineAddressLevelByCoinbaseData(
        EXAMPLE_ADDRESS
      );
      expect(addressLevel).toBe(2);
    });

    test("should refetch transactions if first request failed", async () => {
      await saveMockPriceInLocalDb(1165.69, "ETH");
      const mockedResponse = getSlicedResponseWithOuterTransaction();
      mockedAxios.get.mockRejectedValueOnce({}).mockResolvedValueOnce({
        data: mockedResponse,
      });
      const addressLevel = await determineAddressLevelByCoinbaseData(
        EXAMPLE_ADDRESS
      );
      expect(addressLevel).toBe(1);
    });

    test("should throw error if ten request failed", async () => {
      await saveMockPriceInLocalDb(1165.69, "ETH");
      const rateLimitedResponse = getRateLimitedResponse();
      [...new Array(10).keys()].forEach(() => {
        mockedAxios.get.mockResolvedValueOnce({
          data: rateLimitedResponse,
        });
      });
      await expect(() =>
        determineAddressLevelByCoinbaseData(EXAMPLE_ADDRESS)
      ).rejects.toThrowError("Cannot fetch address details from Etherscan");
    });
  });
});
