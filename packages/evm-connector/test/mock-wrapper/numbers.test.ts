import { expect } from "chai";
import { ethers } from "hardhat";
import { utils } from "redstone-protocol";
import {
  DEFAULT_TIMESTAMP_FOR_TESTS,
  getMockNumericPackage,
} from "../../src/helpers/test-utils";
import { WrapperBuilder } from "../../src/index";
import { MockDataPackageConfig } from "../../src/wrappers/MockWrapper";
import { SampleRedstoneConsumerNumericMock } from "../../typechain-types";
import {
  expectedValues,
  mockPackageConfigs,
  mockPackages,
} from "../numbers-tests-common";

const NUMBER_OF_MOCK_SIGNERS = 10;

describe("SampleRedstoneConsumerNumericMock", function () {
  let contract: SampleRedstoneConsumerNumericMock;

  const testShouldPass = async (
    mockPackages: MockDataPackageConfig[],
    dataFeedId: "ETH" | "BTC"
  ) => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockPackages);

    const tx = await wrappedContract.saveOracleValueInContractStorage(
      utils.convertStringToBytes32(dataFeedId)
    );
    await tx.wait();

    const valueFromContract = await contract.latestSavedValue();

    expect(valueFromContract.toNumber()).to.be.equal(
      expectedValues[dataFeedId]
    );
  };

  const testShouldRevertWith = async (
    mockPackages: MockDataPackageConfig[],
    dataFeedId: string,
    revertMsg: string
  ) => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockPackages);

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
    await testShouldPass(mockPackages, "ETH");
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract (BTC)", async () => {
    await testShouldPass(mockPackages, "BTC");
  });

  it("Should work properly with the greater number of unique signers than required", async () => {
    const newMockPackages = [
      ...mockPackages,
      getMockNumericPackage({
        ...mockPackageConfigs[0],
        mockSignerIndex: NUMBER_OF_MOCK_SIGNERS,
      }),
    ];
    await testShouldPass(newMockPackages, "BTC");
  });

  it("Should revert if data feed id not found", async () => {
    await testShouldRevertWith(
      mockPackages,
      "BTC2",
      "Insufficient number of unique signers"
    );
  });

  it("Should revert for too old timestamp", async () => {
    const newMockPackages = [...mockPackages];
    newMockPackages[1] = getMockNumericPackage({
      ...mockPackageConfigs[1],
      timestampMilliseconds: DEFAULT_TIMESTAMP_FOR_TESTS - 1,
    });
    await testShouldRevertWith(
      newMockPackages,
      "BTC",
      "Timestamp is not valid"
    );
  });

  it("Should revert for an unauthorised signer", async () => {
    const newMockPackages = [...mockPackages];
    newMockPackages[1] = getMockNumericPackage({
      ...mockPackageConfigs[1],
      mockSignerIndex: 19, // unauthorised signer index
    });
    await testShouldRevertWith(
      newMockPackages,
      "BTC",
      "Signer is not authorised"
    );
  });

  it("Should revert for insufficient number of signers", async () => {
    const newMockPackages = mockPackages.slice(0, NUMBER_OF_MOCK_SIGNERS - 1);
    await testShouldRevertWith(
      newMockPackages,
      "BTC",
      "Insufficient number of unique signers"
    );
  });

  it("Should revert for duplicated packages (not enough unique signers)", async () => {
    const newMockPackages = [...mockPackages];
    newMockPackages[1] = mockPackages[0];
    await testShouldRevertWith(
      newMockPackages,
      "BTC",
      "Insufficient number of unique signers"
    );
  });
});
