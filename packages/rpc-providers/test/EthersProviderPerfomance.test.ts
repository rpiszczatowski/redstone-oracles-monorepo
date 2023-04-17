// Doc: https://docs.ethers.org/v5/api/providers/other/
// Known issues - https://github.com/ethers-io/ethers.js/issues?q=is%3Aissue+is%3Aopen+fallback+provider
// 1. not respecting network errors - https://github.com/ethers-io/ethers.js/issues/3366
// 2. Don't catch detect network error - https://github.com/ethers-io/ethers.js/issues/2837

// we have to use StaticJsonRpcProvider cause - https://github.com/ethers-io/ethers.js/issues/2837
import * as hardhat from "hardhat";
import chai, { expect } from "chai";
import * as sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import { providers, Signer, Wallet } from "ethers";
import { ProviderWithFallback } from "../src/ProviderWithFallback";
import { Counter } from "../typechain-types";
import { FallbackProvider } from "@ethersproject/providers";

chai.use(chaiAsPromised);

const TEST_PRIV_KEY = "";

const FIRST_RPC = "https://goerli-rollup.arbitrum.io/rpc/";
const SECOND_RPC = "https://arbitrum-goerli.blastapi.io/REDACTED";
const THIRD_RPC = "https://arb-goerli.g.alchemy.com/v2/demo";

const PROBE = 10;
describe("FallBack provider", () => {
  let signer: Signer = new Wallet(TEST_PRIV_KEY);
  describe("with first always failing and second always working provider", () => {
    let fallbackProvider: providers.Provider;
    let contract: Counter;
    const soloProvider = new providers.StaticJsonRpcProvider(SECOND_RPC);

    beforeEach(async () => {
      const providerOne = new providers.StaticJsonRpcProvider(FIRST_RPC);
      const providerTwo = new providers.StaticJsonRpcProvider(SECOND_RPC);
      const providerThree = new providers.StaticJsonRpcProvider(THIRD_RPC);

      fallbackProvider = new FallbackProvider([
        { provider: providerOne, priority: 1 },
        { provider: providerTwo, priority: 0 },
        { provider: providerThree, priority: 1 },
      ]);

      const ContractFactory = await hardhat.ethers.getContractFactory(
        "Counter"
      );
      contract = await ContractFactory.connect(
        signer.connect(soloProvider)
      ).deploy();
      await contract.deployed();
    });

    afterEach(() => {});

    it("should read from contract", async () => {
      const counter = contract.connect(signer.connect(fallbackProvider));
      const counterSolo = contract.connect(signer.connect(soloProvider));

      for (let i = 0; i < PROBE; i++) {
        const label = `FALLBACK WRITE ${i}`;
        console.time(label);
        const tx = await counter.inc();
        expect(await tx.wait()).not.to.be.undefined;
        console.timeEnd(label);
      }

      for (let i = 0; i < PROBE; i++) {
        const label = `SOLO  WRITE ${i}`;
        console.time(label);
        const tx = await counterSolo.inc();
        expect(await tx.wait()).not.to.be.undefined;
        console.timeEnd(label);
      }
    });
  });
});
