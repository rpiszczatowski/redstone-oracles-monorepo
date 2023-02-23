import { expect } from "chai";
import { ethers } from "hardhat";
import { utils } from "redstone-protocol";
import {
  DEFAULT_TIMESTAMP_FOR_TESTS,
  getMockNumericPackage,
} from "../../src/helpers/test-utils";
import { WrapperBuilder } from "../../src/index";
import { MockDataPackageConfig } from "../../src/wrappers/MockWrapper";
import { MockMultiSignDataPackageConfig } from "../../src/wrappers/MockWrapperMultiSign";
import { SampleRedstoneConsumerNumericMockMultiSign } from "../../typechain-types";
import {
  expectedNumericValues,
  mockNumericPackageMultiSignConfig,
  mockNumericPackageMultiSign,
  NUMBER_OF_MOCK_NUMERIC_SIGNERS,
  UNAUTHORISED_SIGNER_INDEX,
} from "../tests-common";

describe("SampleRedstoneConsumerNumericMockMultiSign", function () {
  let contract: SampleRedstoneConsumerNumericMockMultiSign;

  const testShouldPass = async (
    mockNumericPackage: MockMultiSignDataPackageConfig,
    dataFeedId: "ETH" | "BTC"
  ) => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockDataPackagesMultiSign(mockNumericPackage);

    const tx = await wrappedContract.saveOracleValueInContractStorage(
      utils.convertStringToBytes32(dataFeedId)
    );
    await tx.wait();

    const valueFromContract = await contract.latestSavedValue();

    expect(valueFromContract.toNumber()).to.be.equal(
      expectedNumericValues[dataFeedId]
    );
  };

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerNumericMockMultiSign"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract (ETH)", async () => {
    await testShouldPass(mockNumericPackageMultiSign, "ETH");
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract (BTC)", async () => {
    await testShouldPass(mockNumericPackageMultiSign, "BTC");
  });
});
