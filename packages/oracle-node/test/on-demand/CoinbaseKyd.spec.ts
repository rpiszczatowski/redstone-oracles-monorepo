import axios from "axios";
import { mockRedstoneApiPrice } from "../fetchers/_helpers";
import { determineAddressLevelByCoinbaseData } from "../../src/on-demand/CoinbaseKyd";
import * as CoinbaseKyd from "../../src/on-demand/CoinbaseKyd";
import exampleResponse from "./example-response.json";
import {
  getMultipliedResponse,
  getRateLimitedResponse,
  getResponseWithOuterTransaction,
  getSlicedResponseWithOuterTransaction,
} from "./helpers";
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const EXAMPLE_ADDRESS = "0x473780deaf4a2ac070bbba936b0cdefe7f267dfc";
(CoinbaseKyd as any).RETRY_INTERVAL = 10;

describe("Coinbase KYD", () => {
  describe("determineAddressLevelByCoinbaseData", () => {
    beforeAll(() => {
      mockRedstoneApiPrice(1165.69, "ETH");
    });

    test("should return level 3", async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: exampleResponse });
      const addressLevel = await determineAddressLevelByCoinbaseData(
        EXAMPLE_ADDRESS
      );
      expect(addressLevel).toBe(3);
    });

    test("should return level 2", async () => {
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
