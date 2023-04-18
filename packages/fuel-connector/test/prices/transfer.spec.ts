import { NativeAssetId, Provider } from "fuels";
import { Wallet } from "@fuel-ts/wallet";
import { seedTestWallet } from "../common/test-utils";

jest.setTimeout(10 * 60000);

const IS_LOCAL = 1;

const provider = IS_LOCAL
  ? undefined
  : new Provider("https://beta-3.fuel.network/graphql");

const wallet = Wallet.fromPrivateKey(process.env.PRIVATE_KEY!, provider);

describe("Faucet from GENESIS wallet", () => {
  it("Transfer 0.001 ETHs", async () => {
    await seedTestWallet(wallet, [[1_000_000, NativeAssetId]]);
  });
});
