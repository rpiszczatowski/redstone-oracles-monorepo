import * as hardhat from "hardhat";
import chai, { expect } from "chai";
import * as sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import { providers, Signer, Wallet } from "ethers";
import { ProviderWithFallback } from "../src/ProviderWithFallback";
import { Counter } from "../typechain-types";

chai.use(chaiAsPromised);

const TEST_PRIV_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

describe("ProviderWithFallback", () => {
  let signer: Signer = new Wallet(TEST_PRIV_KEY);
  describe("with first always failing and second always working provider", () => {
    let fallbackProvider: ProviderWithFallback;
    let contract: Counter;

    beforeEach(async () => {
      const alwaysFailingProvider = new providers.JsonRpcProvider(
        "http://blabla.xd"
      );
      fallbackProvider = new ProviderWithFallback([
        alwaysFailingProvider,
        hardhat.ethers.provider,
      ]);

      const ContractFactory = await hardhat.ethers.getContractFactory(
        "Counter"
      );
      contract = await ContractFactory.deploy();
      await contract.deployed();
    });

    afterEach(() => {});

    it("should read from contract", async () => {
      const counter = contract.connect(signer.connect(fallbackProvider));

      expect(await counter.getCount()).to.eq(0);
    });

    it("should write to contract", async () => {
      const counter = contract.connect(signer.connect(fallbackProvider));

      const tx = await counter.inc();
    });

    it("should await tx", async () => {
      const counter = contract.connect(signer.connect(fallbackProvider));

      const tx = await counter.inc();
      expect(await tx.wait()).not.to.be.undefined;
    });
  });

  it("should call second provider if first fails", async () => {
    const stubProvider = new providers.StaticJsonRpcProvider();
    const spy = sinon.stub(stubProvider, "getBlockNumber");

    const fallbackProvider = new ProviderWithFallback([
      stubProvider,
      stubProvider,
    ]);

    spy.onFirstCall().rejects().onSecondCall().resolves(10);

    expect(await fallbackProvider.getBlockNumber()).to.eq(10);
  });

  it("should call first provider if second fails, and the second provider is currently used", async () => {
    const stubProvider = new providers.StaticJsonRpcProvider();
    const spy = sinon.stub(stubProvider, "getBlockNumber");

    const fallbackProvider = new ProviderWithFallback([
      stubProvider,
      stubProvider,
    ]);

    spy.onFirstCall().rejects().onSecondCall().resolves(10);

    expect(await fallbackProvider.getBlockNumber()).to.eq(10);

    spy.reset();
    spy.onFirstCall().rejects().onSecondCall().resolves(10);
    expect(await fallbackProvider.getBlockNumber()).to.eq(10);
  });

  it("should propagate if both fails", async () => {
    const stubProvider = new providers.StaticJsonRpcProvider();
    const spy = sinon.stub(stubProvider, "getBlockNumber");

    const fallbackProvider = new ProviderWithFallback([
      stubProvider,
      stubProvider,
    ]);

    spy.onFirstCall().rejects().onSecondCall().rejects();

    await expect(fallbackProvider.getBlockNumber()).rejected;
  });

  it("should react on events event if current provider is second one (and first doesn't work)", async () => {
    const ContractFactory = await hardhat.ethers.getContractFactory("Counter");
    const contract = await ContractFactory.deploy();
    await contract.deployed();

    const alwaysFailingProvider = new providers.JsonRpcProvider(
      "http://blabla.xd"
    );
    const fallbackProvider = new ProviderWithFallback([
      alwaysFailingProvider,
      hardhat.ethers.provider,
    ]);

    const onBlockSpy = sinon.spy();
    fallbackProvider.on("block", onBlockSpy);
    // first provider fails so fallback switch to another
    await fallbackProvider.getBlockNumber();

    const tx = await contract.connect(signer.connect(fallbackProvider)).inc();
    await fallbackProvider.waitForTransaction(tx.hash);

    await new Promise((r) => setTimeout(r, 100));
    expect(onBlockSpy.callCount).to.eq(1);
  });

  it("removing listener after swapping providers", async () => {
    const ContractFactory = await hardhat.ethers.getContractFactory("Counter");
    const contract = await ContractFactory.deploy();
    await contract.deployed();

    const alwaysFailingProvider = new providers.JsonRpcProvider(
      "http://blabla.xd"
    );
    const fallbackProvider = new ProviderWithFallback([
      alwaysFailingProvider,
      hardhat.ethers.provider,
    ]);

    const onBlockSpy = sinon.spy();
    fallbackProvider.on("block", onBlockSpy);
    // first provider fails so fallback switch to another
    await fallbackProvider.getBlockNumber();
    fallbackProvider.off("block");

    const tx = await contract.connect(signer.connect(fallbackProvider)).inc();
    await fallbackProvider.waitForTransaction(tx.hash);

    await new Promise((r) => setTimeout(r, 100));
    expect(onBlockSpy.callCount).to.eq(0);
  });

  it("event is triggered only once per all fallback providers", async () => {
    const ContractFactory = await hardhat.ethers.getContractFactory("Counter");
    const contract = await ContractFactory.deploy();
    await contract.deployed();

    const alwaysFailingProvider = new providers.JsonRpcProvider(
      "http://blabla.xd"
    );

    const fallbackProvider = new ProviderWithFallback([
      alwaysFailingProvider,
      hardhat.ethers.provider,
    ]);

    const onBlockSpy = sinon.spy();
    fallbackProvider.on("block", onBlockSpy);
    // first provider fails so fallback switch to another
    await fallbackProvider.getBlockNumber();

    expect(alwaysFailingProvider.listenerCount()).to.eq(0);
    expect(fallbackProvider.listenerCount()).to.eq(1);
    expect(hardhat.ethers.provider.listenerCount()).to.eq(1);
  });

  it("should revert", async () => {
    const ContractFactory = await hardhat.ethers.getContractFactory("Counter");
    const contract = await ContractFactory.deploy();
    await contract.deployed();

    await expect(contract.fail()).rejectedWith();
  });
});
