import { UniversalSigner } from "@redstone-finance/protocol";
import { ethers } from "ethers";
import { SafeSignerFromProcessEnv } from "../../src/signers/SafeSigner";

const PRIVATE_KEY_FOR_TESTS =
  "0x1111111111111111111111111111111111111111111111111111111111111111";
process.env["PRIV_KEY_TEST"] = PRIVATE_KEY_FOR_TESTS;
const safeSigner = SafeSignerFromProcessEnv("PRIV_KEY_TEST");
const stringifiableData = [
  { hehe: 123, haha: 234 },
  { hehe: 123, haha: 234 },
  { hehe: 42, haha: 234 },
  { hehe: 123, haha: 42, hoho: 3498363.344 },
];

describe("SafeSignerFromProcessEnv", () => {
  it("can't read private key from env", () => {
    expect(process.env["PRIV_KEY_TEST"]).toBe("[PRIVATE KEY WAS REMOVED]");
  });

  it("can't read private key from safeSigner", () => {
    const toHack = safeSigner as unknown as { privateKey: string };
    expect(toHack.privateKey).toBe(undefined);
  });

  it("Should properly sign and verify stringifiable data", () => {
    const signature = safeSigner.signStringifiableData(stringifiableData);
    const recoveredSigner = UniversalSigner.recoverSigner(
      stringifiableData,
      signature
    );
    expect(recoveredSigner).toBe(
      new ethers.Wallet(PRIVATE_KEY_FOR_TESTS).address
    );
  });

  it("Should not verify incorrectly signed data", () => {
    const signature = safeSigner.signStringifiableData(stringifiableData);
    const recoveredSigner = UniversalSigner.recoverSigner(
      [...stringifiableData, { hoho: 100 }],
      signature
    );
    expect(recoveredSigner).not.toBe(
      new ethers.Wallet(PRIVATE_KEY_FOR_TESTS).address
    );
  });
});
