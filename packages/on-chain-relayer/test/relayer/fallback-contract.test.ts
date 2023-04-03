import chai, { expect } from "chai";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { BigNumber } from "ethers";
import sinon from "sinon";
import { getAdapterContract } from "../../src/core/contract-interactions/get-contract";
import { PriceFeedsAdapter } from "../../typechain-types";
import * as getProviderOrSigner from "../../src/core/contract-interactions/get-provider-or-signer";
import * as hardhat from "hardhat";
import { mockEnvVariables } from "../helpers";
import chaiAsPromised from "chai-as-promised";
import { network } from "hardhat";

chai.use(chaiAsPromised);

describe("fallback contract decorator", () => {
  let getProviderStub: sinon.SinonStub<
    [providerIndex?: number | undefined],
    StaticJsonRpcProvider
  >;

  before(async () => {
    mockEnvVariables();
    await network.provider.send("hardhat_reset");
    getProviderStub = sinon.stub(getProviderOrSigner, "getProvider");
    getProviderStub.returns(hardhat.ethers.provider);
  });

  after(() => {
    getProviderStub.restore();
  });

  afterEach(() => {
    getProviderStub.reset();
    getProviderStub.returns(hardhat.ethers.provider);
  });

  it("should read contract state", async () => {
    const contract = getAdapterContract() as PriceFeedsAdapter;

    const result = await contract.validateTimestamp(
      BigNumber.from(new Date().getTime() + 1000)
    );

    expect(result).to.be.not.undefined;
  });

  it("should write to contract state", async () => {
    const contract = getAdapterContract() as PriceFeedsAdapter;

    const result = await contract.addDataFeedIdAndUpdateValues(
      "0x" + "0".repeat(64),
      new Date().getTime() + 1000
    );

    expect(result).to.be.not.undefined;
  });

  it("should fallback to second provider if first fails", async () => {
    getProviderStub.reset();
    getProviderStub
      .onFirstCall()
      .returns(new StaticJsonRpcProvider("https://blaba.xd"))
      .onSecondCall()
      .returns(hardhat.ethers.provider);

    const contract = getAdapterContract() as PriceFeedsAdapter;

    const result = await contract.addDataFeedIdAndUpdateValues(
      "0x" + "0".repeat(64),
      new Date().getTime() + 1000
    );

    expect(result).to.be.not.undefined;
  });

  it("should propagate error if all providers fails", async () => {
    getProviderStub.reset();
    // always return failing provider
    getProviderStub.returns(new StaticJsonRpcProvider("https://blaba.xd"));

    const contract = getAdapterContract() as PriceFeedsAdapter;

    await expect(
      contract.addDataFeedIdAndUpdateValues(
        "0x" + "0".repeat(64),
        new Date().getTime() + 1000
      )
    ).rejected;
  });
});
