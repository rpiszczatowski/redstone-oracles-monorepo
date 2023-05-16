import { ethers } from "hardhat";
import { utils } from "redstone-protocol";
import { expect } from "chai";
import { SampleRedstoneConsumerNumericMock } from "../../typechain-types";
import {
  expectedNumericValues,
  IMockDataPackagesSuite,
  MockNumericDataPackagesMultiSignSuite,
  MockNumericDataPackagesSingleSignSuite,
} from "../tests-common";
import { MockDataPackageConfig } from "../../src/wrappers/MockWrapper";
import { MockMultiSignDataPackageConfig } from "../../src/wrappers/MockWrapperMultiSign";
import { wrapContractUsingMockDataPackages } from "../../src/helpers/test-utils";

interface NumbersTestParams {
  mockDataPackagesSuite: IMockDataPackagesSuite;
}

const describeConsumerNumericTests = ({
  mockDataPackagesSuite,
}: NumbersTestParams) => {
  describe("SampleRedstoneConsumerNumericMock", function () {
    let contract: SampleRedstoneConsumerNumericMock;

    const testShouldPass = async (
      mockNumericPackages:
        | MockDataPackageConfig[]
        | MockMultiSignDataPackageConfig,
      dataFeedId: "ETH" | "BTC"
    ) => {
      const wrappedContract = wrapContractUsingMockDataPackages(
        contract,
        mockNumericPackages
      );

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
      mockNumericPackages:
        | MockDataPackageConfig[]
        | MockMultiSignDataPackageConfig,
      dataFeedId: string,
      revertMsg: string
    ) => {
      const wrappedContract = wrapContractUsingMockDataPackages(
        contract,
        mockNumericPackages
      );

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
      await testShouldPass(mockDataPackagesSuite.mockDataPackages, "ETH");
    });

    it("Should properly execute transaction on RedstoneConsumerBase contract (BTC)", async () => {
      await testShouldPass(mockDataPackagesSuite.mockDataPackages, "BTC");
    });

    it("Should work properly with the greater number of unique signers than required", async () => {
      await testShouldPass(
        mockDataPackagesSuite.mockDataPackagesWithAdditionalSigner,
        "BTC"
      );
    });

    it("Should revert if data feed id not found", async () => {
      await testShouldRevertWith(
        mockDataPackagesSuite.mockDataPackages,
        "NOT_BTC_AND_NOT_ETH",
        "InsufficientNumberOfUniqueSigners(0, 10)"
      );
    });

    it("Should revert for too old timestamp", async () => {
      await testShouldRevertWith(
        mockDataPackagesSuite.mockDataPackagesWithTooOldTimestamp,
        "BTC",
        "TimestampIsNotValid()"
      );
    });

    it("Should revert for an unauthorised signer", async () => {
      await testShouldRevertWith(
        mockDataPackagesSuite.mockDataPackagesWithUnauthorizedSigner,
        "BTC",
        `SignerNotAuthorised("0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199")`
      );
    });

    it("Should revert for insufficient number of signers", async () => {
      await testShouldRevertWith(
        mockDataPackagesSuite.mockDataPackagesWithInsufficientNumberOfSigners,
        "BTC",
        "InsufficientNumberOfUniqueSigners(9, 10)"
      );
    });

    it("Should revert for duplicated packages (not enough unique signers)", async () => {
      await testShouldRevertWith(
        mockDataPackagesSuite.mockDataPackagesWithDuplicateSigner,
        "BTC",
        "InsufficientNumberOfUniqueSigners(9, 10)"
      );
    });
  });
};

describe("SampleRedstoneConsumerNumericMockSingleSign", () => {
  describeConsumerNumericTests({
    mockDataPackagesSuite: new MockNumericDataPackagesSingleSignSuite(),
  });
});

describe("SampleRedstoneConsumerNumericMockMultiSign", () => {
  describeConsumerNumericTests({
    mockDataPackagesSuite: new MockNumericDataPackagesMultiSignSuite(),
  });
});
