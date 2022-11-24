import axios from "axios";
import { mockRedstoneApiPrice } from "../fetchers/_helpers";
import { determineAddressLevelByCoinbaseData } from "../../src/on-demand/CoinbaseKyd";
import exampleResponse from "./example-response.json";
import {
  getMultipliedResponse,
  getResponseWithOuterTransaction,
  getSlicedResponseWithOuterTransaction,
} from "./helpers";
jest.mock("axios");

const EXAMPLE_ADDRESS = "0x473780deaf4a2ac070bbba936b0cdefe7f267dfc";

describe("Coinbase KYD", () => {
  describe("determineAddressLevelByCoinbaseData", () => {
    beforeAll(() => {
      mockRedstoneApiPrice(1165, "ETH");
    });

    test("should return level 3", async () => {
      const mockedAxios = axios as jest.Mocked<typeof axios>;
      mockedAxios.get.mockResolvedValueOnce({ data: exampleResponse });
      const addressLevel = await determineAddressLevelByCoinbaseData(
        EXAMPLE_ADDRESS
      );
      expect(addressLevel).toBe(3);
    });

    test("should return level 2", async () => {
      const mockedAxios = axios as jest.Mocked<typeof axios>;
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
      const mockedAxios = axios as jest.Mocked<typeof axios>;
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
      const mockedAxios = axios as jest.Mocked<typeof axios>;
      const multipliedResponse = getMultipliedResponse();
      mockedAxios.get.mockResolvedValueOnce({
        data: { result: multipliedResponse },
      });
      mockedAxios.get.mockResolvedValueOnce({
        data: exampleResponse,
      });
      const addressLevel = await determineAddressLevelByCoinbaseData(
        EXAMPLE_ADDRESS
      );
      expect(addressLevel).toBe(3);
    });

    test("should handle pagination and return level 2", async () => {
      const mockedAxios = axios as jest.Mocked<typeof axios>;
      const multipliedResponse = getMultipliedResponse();
      mockedAxios.get.mockResolvedValueOnce({
        data: { result: multipliedResponse },
      });
      const mockedResponse = getResponseWithOuterTransaction();
      mockedAxios.get.mockResolvedValueOnce({
        data: mockedResponse,
      });
      const addressLevel = await determineAddressLevelByCoinbaseData(
        EXAMPLE_ADDRESS
      );
      expect(addressLevel).toBe(2);
    });
  });
});
