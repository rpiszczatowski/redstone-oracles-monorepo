import { expect } from "chai";
import { ethers } from "hardhat";
import { utils } from "redstone-protocol";
import {
  DEFAULT_TIMESTAMP_FOR_TESTS,
  getMockNumericMultiSignPackage,
} from "../../src/helpers/test-utils";
import { WrapperBuilder } from "../../src/index";
import { MockMultiSignDataPackageConfig } from "../../src/wrappers/MockWrapperMultiSign";
import { SampleRedstoneConsumerNumericMock } from "../../typechain-types";
import {
  expectedNumericValues,
  mockNumericPackageMultiSignConfig,
  mockNumericPackageMultiSign,
  UNAUTHORISED_SIGNER_INDEX,
} from "../tests-common";

describe("SampleRedstoneConsumerNumericMockMultiSign", function () {
  let contract: SampleRedstoneConsumerNumericMock;

  const testShouldPass = async (
    mockNumericPackage: MockMultiSignDataPackageConfig,
    dataFeedId: "ETH" | "BTC"
  ) => {
    const wrappedContract = WrapperBuilder.wrap(
      contract
    ).usingMockMultiSignDataPackages(mockNumericPackage);

    const tx = await wrappedContract.saveOracleValueInContractStorage(
      utils.convertStringToBytes32(dataFeedId)
    );
    await tx.wait();

    const valueFromContract = await contract.latestSavedValue();

    expect(valueFromContract.toNumber()).to.be.equal(
      expectedNumericValues[dataFeedId]
    );
  };

  const testShouldRevertWith = async (
    mockNumericPackage: MockMultiSignDataPackageConfig,
    dataFeedId: string,
    revertMsg: string
  ) => {
    const wrappedContract = WrapperBuilder.wrap(
      contract
    ).usingMockMultiSignDataPackages(mockNumericPackage);

    await expect(
      wrappedContract.saveOracleValueInContractStorage(
        utils.convertStringToBytes32(dataFeedId)
      )
    ).to.be.revertedWith(revertMsg);
  };

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerNumericMock"
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

  it("Should work properly with the greater number of unique signers than required", async () => {
    const newMockPackage = {
      ...mockNumericPackageMultiSign,
      mockSignerIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    };
    await testShouldPass(newMockPackage, "BTC");
  });

  it("Should revert if data feed id not found", async () => {
    await testShouldRevertWith(
      mockNumericPackageMultiSign,
      "NOT_BTC_AND_NOT_ETH",
      "InsufficientNumberOfUniqueSigners(0, 10)"
    );
  });
  it("Should revert for too old timestamp", async () => {
    const newMockPackage = getMockNumericMultiSignPackage({
      ...mockNumericPackageMultiSignConfig,
      timestampMilliseconds: DEFAULT_TIMESTAMP_FOR_TESTS - 1,
    });

    await testShouldRevertWith(newMockPackage, "BTC", "TimestampIsNotValid()");
  });

  it("Should revert for an unauthorised signer", async () => {
    const newMockPackage = getMockNumericMultiSignPackage({
      ...mockNumericPackageMultiSignConfig,
      mockSignerIndices: [0, 1, 2, 3, 4, 5, 6, 7, UNAUTHORISED_SIGNER_INDEX],
    });

    await testShouldRevertWith(
      newMockPackage,
      "BTC",
      `SignerNotAuthorised("0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199")`
    );
  });

  it("Should revert for a duplicate signer", async () => {
    const newMockPackage = getMockNumericMultiSignPackage({
      ...mockNumericPackageMultiSignConfig,
      mockSignerIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 8],
    });

    await testShouldRevertWith(
      newMockPackage,
      "BTC",
      "InsufficientNumberOfUniqueSigners(9, 10)"
    );
  });

  it("Should revert for insufficient number of signers", async () => {
    const newMockPackage = getMockNumericMultiSignPackage({
      ...mockNumericPackageMultiSignConfig,
      mockSignerIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    });

    await testShouldRevertWith(
      newMockPackage,
      "BTC",
      "InsufficientNumberOfUniqueSigners(9, 10)"
    );
  });
});
