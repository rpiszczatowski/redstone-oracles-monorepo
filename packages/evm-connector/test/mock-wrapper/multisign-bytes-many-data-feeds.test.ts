import { expect } from "chai";
import { ethers } from "hardhat";
import { utils } from "redstone-protocol";
import {
  DEFAULT_TIMESTAMP_FOR_TESTS,
  getMockStringMultiSignPackage,
} from "../../src/helpers/test-utils";

import { WrapperBuilder } from "../../src/index";
import { MockMultiSignDataPackageConfig } from "../../src/wrappers/MockWrapperMultiSign";
import { SampleRedstoneConsumerBytesMockManyDataFeeds } from "../../typechain-types";
import {
  expectedBytesValues,
  mockBytesPackageMultiSignConfig,
  mockBytesPackageMultiSign,
  UNAUTHORISED_SIGNER_INDEX,
} from "../tests-common";

describe("SampleRedstoneConsumerBytesMockManyDataFeedsMultiSign", function () {
  let contract: SampleRedstoneConsumerBytesMockManyDataFeeds;

  const testShouldPass = async (
    mockBytesPackage: MockMultiSignDataPackageConfig,
    dataFeedIds: ("ETH" | "BTC")[]
  ) => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockMultiSignDataPackage(mockBytesPackage);
    const tx = await wrappedContract.save2ValuesInStorage([
      utils.convertStringToBytes32(dataFeedIds[0]),
      utils.convertStringToBytes32(dataFeedIds[1]),
    ]);
    await tx.wait();

    const firstValueFromContract = await contract.firstValue();
    const secondValueFromContract = await contract.secondValue();

    expect(firstValueFromContract).to.be.equal(
      expectedBytesValues[dataFeedIds[0]]
    );
    expect(secondValueFromContract).to.be.equal(
      expectedBytesValues[dataFeedIds[1]]
    );
  };

  const testShouldRevertWith = async (
    mockBytesPackage: MockMultiSignDataPackageConfig,
    dataFeedIds: string[],
    revertMsg: string
  ) => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockMultiSignDataPackage(mockBytesPackage);

    await expect(
      wrappedContract.save2ValuesInStorage(
        dataFeedIds.map(utils.convertStringToBytes32)
      )
    ).to.be.revertedWith(revertMsg);
  };

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerBytesMockManyDataFeeds"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract (order: ETH, BTC)", async () => {
    await testShouldPass(mockBytesPackageMultiSign, ["ETH", "BTC"]);
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract (order: BTC, ETH)", async () => {
    await testShouldPass(mockBytesPackageMultiSign, ["BTC", "ETH"]);
  });

  it("Should work properly with the greater number of unique signers than required", async () => {
    const newMockPackage = {
      ...mockBytesPackageMultiSign,
      mockSignerIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    };
    await testShouldPass(newMockPackage, ["BTC", "ETH"]);
  });

  it("Should revert if data feed id not found", async () => {
    await testShouldRevertWith(
      mockBytesPackageMultiSign,
      ["BTC", "NOT_BTC_AND_NOT_ETH"],
      "InsufficientNumberOfUniqueSigners(0, 3)"
    );
  });

  it("Should revert for too old timestamp", async () => {
    const newMockPackage = getMockStringMultiSignPackage({
      ...mockBytesPackageMultiSignConfig,
      timestampMilliseconds: DEFAULT_TIMESTAMP_FOR_TESTS - 1,
    });

    await testShouldRevertWith(
      newMockPackage,
      ["BTC", "ETH"],
      "TimestampIsNotValid()"
    );
  });

  it("Should revert for an unauthorised signer", async () => {
    const newMockPackage = getMockStringMultiSignPackage({
      ...mockBytesPackageMultiSignConfig,
      mockSignerIndices: [0, 1, UNAUTHORISED_SIGNER_INDEX],
    });

    await testShouldRevertWith(
      newMockPackage,
      ["BTC", "ETH"],
      `SignerNotAuthorised("0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199")`
    );
  });

  it("Should revert for insufficient number of signers", async () => {
    const newMockPackage = getMockStringMultiSignPackage({
      ...mockBytesPackageMultiSignConfig,
      mockSignerIndices: [0, 1],
    });

    await testShouldRevertWith(
      newMockPackage,
      ["BTC", "ETH"],
      "InsufficientNumberOfUniqueSigners(2, 3)"
    );
  });

  it("Should revert for duplicated packages (not enough unique signers)", async () => {
    const newMockPackage = getMockStringMultiSignPackage({
      ...mockBytesPackageMultiSignConfig,
      mockSignerIndices: [0, 1, 1],
    });

    await testShouldRevertWith(
      newMockPackage,
      ["BTC", "ETH"],
      "InsufficientNumberOfUniqueSigners(2, 3)"
    );
  });
});
