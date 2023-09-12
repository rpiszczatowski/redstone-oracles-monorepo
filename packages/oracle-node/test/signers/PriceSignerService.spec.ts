import { ethers } from "ethers";
import PriceSignerService from "../../src/signers/PriceSignerService";
import { PriceDataBeforeSigning } from "../../src/types";
import { SafeNumber } from "redstone-utils";

const testPrivKey =
  "0xc094df8d4a95134e721b2e418f53658c3927ee21b62b9b63c4331a902199e1e8";

describe("PriceSignerService", () => {
  describe("signPrices", () => {
    const signer = new PriceSignerService(testPrivKey);
    it("should sign prices which are numbers", async () => {
      const prices: PriceDataBeforeSigning[] = [
        {
          permawebTx: "permawebtx",
          provider: "provider1",
          id: "id1",
          symbol: "symbol",
          source: {},
          timestamp: 1630454400000,
          version: "v1",
          value: 102.123,
          sourceMetadata: {},
        },
      ];

      expect(await signer.signPrices(prices)).toEqual([
        {
          id: "id1",
          liteEvmSignature:
            "0xf84df55411e8bdab4fa41bb90e1f9d487206ad479271dd9394d959ff7cec6e8a4f51b1c67e935f0b672257a7d03bedd270a7a29330df1034c921817c863ef1901b",
          permawebTx: "permawebtx",
          provider: "provider1",
          source: {},
          symbol: "symbol",
          timestamp: 1630454400000,
          value: 102.123,
          version: "v1",
          sourceMetadata: {},
        },
      ]);
    });

    it("should FAIL to sign prices which are SafeNumbers", async () => {
      const prices: PriceDataBeforeSigning[] = [
        {
          permawebTx: "permawebtx",
          provider: "provider1",
          id: "id1",
          symbol: "symbol",
          source: {},
          timestamp: Date.now(),
          version: "v1",
          sourceMetadata: {},
          value: SafeNumber.createSafeNumber(102.123) as unknown as number,
        },
      ];

      await expect(signer.signPrices(prices)).rejects.toThrow();
    });
  });
});
