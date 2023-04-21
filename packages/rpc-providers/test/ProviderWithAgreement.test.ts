import * as hardhat from "hardhat";
import chai, { expect } from "chai";
import * as sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import { providers, Signer, Wallet } from "ethers";
import { Counter } from "../typechain-types";
import { ProviderWithAgreement } from "../src/ProviderWithAgreement";

chai.use(chaiAsPromised);

const TEST_PRIV_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
describe("ProviderWithAgreement", () => {
  let contract: Counter;
  let signer: Signer = new Wallet(TEST_PRIV_KEY);

  beforeEach(async () => {
    const ContractFactory = await hardhat.ethers.getContractFactory("Counter");
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  afterEach(() => {});

  describe("with 3 same providers", () => {
    let providerWithAgreement: ProviderWithAgreement;

    beforeEach(async () => {
      providerWithAgreement = new ProviderWithAgreement([
        hardhat.ethers.provider,
        hardhat.ethers.provider,
        hardhat.ethers.provider,
      ]);
    });

    it("should read from contract", async () => {
      const counter = contract.connect(signer.connect(providerWithAgreement));

      expect(await counter.getCount()).to.eq(0);
    });

    it("should write to contract", async () => {
      const counter = contract.connect(signer.connect(providerWithAgreement));

      await counter.inc();
    });

    it("should await tx", async () => {
      const counter = contract.connect(signer.connect(providerWithAgreement));

      const tx = await counter.inc();
      expect(await tx.wait()).not.to.be.undefined;
    });
  });

  describe("with 2 same providers and 1 always failing", () => {
    let providerWithAgreement: ProviderWithAgreement;

    beforeEach(async () => {
      providerWithAgreement = new ProviderWithAgreement([
        new providers.StaticJsonRpcProvider("http://blabla.xd"),
        hardhat.ethers.provider,
        hardhat.ethers.provider,
      ]);
    });

    it("should read from contract", async () => {
      const counter = contract.connect(signer.connect(providerWithAgreement));

      expect(await counter.getCount()).to.eq(0);
    });

    it("should write to contract", async () => {
      const counter = contract.connect(signer.connect(providerWithAgreement));

      await counter.inc();
    });

    it("should await tx", async () => {
      const counter = contract.connect(signer.connect(providerWithAgreement));

      const tx = await counter.inc();
      expect(await tx.wait()).not.to.be.undefined;
    });
  });

  describe("with  1 good provider 1 bad provider and 1 always failing", () => {
    let providerWithAgreement: ProviderWithAgreement;

    const falseProvider = new providers.StaticJsonRpcProvider(
      "http://blabla.xd"
    );

    // return bad result - should be 0
    sinon
      .stub(falseProvider, "call")
      .onFirstCall()
      .returns(Promise.resolve(`0x${"0".repeat(31)}9`));

    beforeEach(async () => {
      providerWithAgreement = new ProviderWithAgreement([
        falseProvider,
        new providers.StaticJsonRpcProvider("http://blabla.xd"),
        hardhat.ethers.provider,
      ]);
    });

    it("should read from contract", async () => {
      const counter = contract.connect(signer.connect(providerWithAgreement));

      await expect(counter.getCount()).rejectedWith(
        `Failed to find at least 2 agreeing providers.`
      );
    });

    it("should write to contract", async () => {
      const counter = contract.connect(signer.connect(providerWithAgreement));

      await counter.inc();
    });

    it("should await tx", async () => {
      const counter = contract.connect(signer.connect(providerWithAgreement));

      const tx = await counter.inc();
      expect(await tx.wait()).not.to.be.undefined;
    });
  });

  describe("with  1 good provider and 2 always failing", () => {
    let providerWithAgreement: ProviderWithAgreement;
    beforeEach(async () => {
      providerWithAgreement = new ProviderWithAgreement([
        hardhat.ethers.provider,
        new providers.StaticJsonRpcProvider("http://blabla.xd"),
        new providers.StaticJsonRpcProvider("http://blabla.xd"),
      ]);
    });

    it("should read from contract", async () => {
      const counter = contract.connect(signer.connect(providerWithAgreement));

      await expect(counter.getCount()).rejectedWith(
        `Failed to find at least 2 agreeing providers.`
      );
    });

    it("should write to contract", async () => {
      const counter = contract.connect(signer.connect(providerWithAgreement));

      await counter.inc();
    });

    it("should await tx", async () => {
      const counter = contract.connect(signer.connect(providerWithAgreement));

      const tx = await counter.inc();
      expect(await tx.wait()).not.to.be.undefined;
    });
  });
});
