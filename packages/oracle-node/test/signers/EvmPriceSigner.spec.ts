import { ethers } from "ethers";
import EvmPriceSigner from "../../src/signers/EvmPriceSigner";
import { PricePackage, SignedPricePackage } from "../../src/types";
import { SafeNumber } from "redstone-utils";

const evmSigner = new EvmPriceSigner();
const ethereumPrivateKey =
  "0xb1a057470659e2abab372d853183847cc9c4269ed781d222b2e50f805129490a";

const timestamp = 1688730801416;
describe("evmSignPricesAndVerify", () => {
  jest.useFakeTimers().setSystemTime(new Date("2021-09-01").getTime());

  it("should sign price package", () => {
    // given
    const pricePackage: PricePackage = {
      prices: [
        {
          symbol: "XXX",
          value: 0.0054,
        },
        {
          symbol: "YYY",
          value: 100,
        },
        {
          symbol: "AAA",
          value: 20.003,
        },
      ],
      timestamp,
    };

    // when
    const signedPricesData: SignedPricePackage = evmSigner.signPricePackage(
      pricePackage,
      ethereumPrivateKey
    );

    expect(signedPricesData.liteSignature).toEqual(
      "0xff73e1315ce97f1621c461df47e74eab5eebde0ca0c340c494f1fe4a03d7ba36370f098113ed584e629f1312d863ee0f934418194667f9979e31b7a9757958aa1b"
    );
    // then
    expect(evmSigner.verifyLiteSignature(signedPricesData)).toEqual(true);
  });

  it("should fail verifying wrong lite signature", () => {
    // given
    const pricePackage: PricePackage = {
      prices: [
        {
          symbol: "XXX",
          value: 10,
        },
      ],
      timestamp,
    };
    const anotherPricesPackage = {
      ...pricePackage,
      timestamp: pricePackage.timestamp + 1000, // we add 1000 ms here because lite signature uses unix timestamp (in seconds)
    };

    // when
    const signedPricesData: SignedPricePackage = evmSigner.signPricePackage(
      pricePackage,
      ethereumPrivateKey
    );

    // then
    expect(signedPricesData.liteSignature).toEqual(
      "0xf3988ee68070dc7ca1339ebc8780eb57702d655bda61dd38a4b0ab56b34fe49c52dbbde6903c4884554f39da5a28ba5c66041a2b0d263863c6580f86939d1b9f1c"
    );
    expect(
      evmSigner.verifyLiteSignature({
        ...signedPricesData,
        pricePackage: anotherPricesPackage,
      })
    ).toEqual(false);
  });

  it("should fail verifying lite signature for wrong eth address", () => {
    // given
    const pricePackage: PricePackage = {
      prices: [
        {
          symbol: "XXX",
          value: 10,
        },
      ],
      timestamp,
    };

    // when
    const signedPricesData: SignedPricePackage = evmSigner.signPricePackage(
      pricePackage,
      ethereumPrivateKey
    );

    // then
    expect(signedPricesData.liteSignature).toEqual(
      "0xf3988ee68070dc7ca1339ebc8780eb57702d655bda61dd38a4b0ab56b34fe49c52dbbde6903c4884554f39da5a28ba5c66041a2b0d263863c6580f86939d1b9f1c"
    );
    expect(
      evmSigner.verifyLiteSignature({
        ...signedPricesData,
        signerAddress: "0x1111111111111111111111111111111111111111",
      })
    ).toEqual(false);
  });

  it("should sign and verify lite signature even for packages with different price order", () => {
    // given
    const pricePackage1: PricePackage = {
      prices: [
        {
          symbol: "FIRST",
          value: 1,
        },
        {
          symbol: "SECOND",
          value: 2,
        },
      ],
      timestamp,
    };

    const pricePackageWithDifferentOrder: PricePackage = {
      prices: [
        {
          symbol: "SECOND",
          value: 2,
        },
        {
          symbol: "FIRST",
          value: 1,
        },
      ],
      timestamp,
    };

    // when
    const signedPricesData: SignedPricePackage = evmSigner.signPricePackage(
      pricePackage1,
      ethereumPrivateKey
    );

    // then
    expect(signedPricesData.liteSignature).toEqual(
      "0xe9cc60e70cd279532c111006c9e70d7a550703e842d63626c655fb3297d982ef4adfc53df93c62aaec21ec7ea1624153635e3fb7159ed3eacd1b82fc42fb85171c"
    );
    expect(
      evmSigner.verifyLiteSignature({
        ...signedPricesData,
        pricePackage: pricePackageWithDifferentOrder,
      })
    ).toEqual(true);
  });

  it("should fail to sign price package with where value is string", () => {
    const pricePackage1: PricePackage = {
      prices: [
        {
          symbol: "FIRST",
          value: "1.1" as unknown as number,
        },
        {
          symbol: "SECOND",
          value: "100023" as unknown as number,
        },
      ],
      timestamp: Date.now(),
    };
    expect(() =>
      evmSigner.signPricePackage(pricePackage1, ethereumPrivateKey)
    ).toThrow();
  });

  it("should fail to sign price package where value is ISafeNumber instance", () => {
    const pricePackage1: PricePackage = {
      prices: [
        {
          symbol: "FIRST",
          value: SafeNumber.createSafeNumber("1.1") as unknown as number,
        },
        {
          symbol: "SECOND",
          value: SafeNumber.createSafeNumber("100023") as unknown as number,
        },
      ],
      timestamp: Date.now(),
    };
    expect(() =>
      evmSigner.signPricePackage(pricePackage1, ethereumPrivateKey)
    ).toThrow();
  });
});
