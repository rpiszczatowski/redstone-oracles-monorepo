import { expect } from "chai";
import { ethers } from "hardhat";
import { utils } from "redstone-protocol";
import {
  wrapContractUsingMockDataPackages,
} from "../../src/helpers/test-utils";

import { MockDataPackageConfig } from "../../src/wrappers/MockWrapper";
import { SampleRedstoneConsumerBytesMockManyDataFeeds } from "../../typechain-types";
import {
  expectedBytesValues,
} from "../tests-common";
import {
  IMockDataPackagesSuite,
  MockBytesDataPackagesMultiSignSuite,
  MockBytesDataPackagesSingleSignSuite,
} from "../tests-common";
import { MockMultiSignDataPackageConfig } from "../../src/wrappers/MockWrapperMultiSign";

interface BytesManyDataFeedsTestParams {
  mockDataPackagesSuite: IMockDataPackagesSuite;
}

const describeConsumerBytesTestsManyDataFeeds = ({
  mockDataPackagesSuite,
}: BytesManyDataFeedsTestParams) => {
  describe("SampleRedstoneConsumerBytesMockManyDataFeeds", function () {
    let contract: SampleRedstoneConsumerBytesMockManyDataFeeds;

    const testShouldPass = async (
      mockBytesPackages:
        | MockDataPackageConfig[]
        | MockMultiSignDataPackageConfig,
      dataFeedIds: ("ETH" | "BTC")[]
    ) => {
      const wrappedContract = wrapContractUsingMockDataPackages(
        contract,
        mockBytesPackages
      );

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
      mockBytesPackages:
        | MockDataPackageConfig[]
        | MockMultiSignDataPackageConfig,
      dataFeedIds: string[],
      revertMsg: string
    ) => {
      const wrappedContract = wrapContractUsingMockDataPackages(
        contract,
        mockBytesPackages
      );
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
      await testShouldPass(mockDataPackagesSuite.mockDataPackages, [
        "ETH",
        "BTC",
      ]);
    });

    it("Should properly execute transaction on RedstoneConsumerBase contract (order: BTC, ETH)", async () => {
      await testShouldPass(mockDataPackagesSuite.mockDataPackages, [
        "BTC",
        "ETH",
      ]);
    });

    it("Should work properly with the greater number of unique signers than required", async () => {
      await testShouldPass(
        mockDataPackagesSuite.mockDataPackagesWithAdditionalSigner,
        ["BTC", "ETH"]
      );
    });

    it("Should revert if data feed id not found", async () => {
      await testShouldRevertWith(
        mockDataPackagesSuite.mockDataPackages,
        ["BTC", "NOT_BTC_AND_NOT_ETH"],
        "InsufficientNumberOfUniqueSigners(0, 3)"
      );
    });

    it("Should revert for too old timestamp", async () => {
      await testShouldRevertWith(
        mockDataPackagesSuite.mockDataPackagesWithTooOldTimestamp,
        ["BTC", "ETH"],
        "TimestampIsNotValid()"
      );
    });

    it("Should revert for an unauthorised signer", async () => {
      await testShouldRevertWith(
        mockDataPackagesSuite.mockDataPackagesWithUnauthorizedSigner,
        ["BTC", "ETH"],
        `SignerNotAuthorised("0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199")`
      );
    });

    it("Should revert for insufficient number of signers", async () => {
      await testShouldRevertWith(
        mockDataPackagesSuite.mockDataPackagesWithInsufficientNumberOfSigners,
        ["BTC", "ETH"],
        "InsufficientNumberOfUniqueSigners(2, 3)"
      );
    });

    it("Should revert for duplicated packages (not enough unique signers)", async () => {
      await testShouldRevertWith(
        mockDataPackagesSuite.mockDataPackagesWithDuplicateSigner,
        ["BTC", "ETH"],
        "InsufficientNumberOfUniqueSigners(2, 3)"
      );
    });
  });
};

describe("SampleRedstoneConsumerBytesMockManyDataFeedsSingleSign", () => {
  describeConsumerBytesTestsManyDataFeeds({
    mockDataPackagesSuite: new MockBytesDataPackagesSingleSignSuite(),
  });
});

describe("SampleRedstoneConsumerBytesMockManyDataFeedsMultiSign", () => {
  describeConsumerBytesTestsManyDataFeeds({
    mockDataPackagesSuite: new MockBytesDataPackagesMultiSignSuite(),
  });
});
