import { ethers } from "hardhat";
import { utils } from "redstone-protocol";
import { expect } from "chai";
import { SampleRedstoneConsumerNumericMockManyDataFeeds } from "../../typechain-types";
import {
  expectedNumericValues,
  mockNumericPackageConfigs,
  IMockDataPackagesSuite,
  MockNumericDataPackagesMultiSignSuite,
  MockNumericDataPackagesSingleSignSuite,
  NUMBER_OF_MOCK_NUMERIC_SIGNERS,
} from "../tests-common";
import {
  getMockNumericPackage,
  MockNumericPackageArgs,
  getRange,
} from "../../src/helpers/test-utils";
import { MockDataPackageConfig } from "../../src/wrappers/MockWrapper";
import { MockMultiSignDataPackageConfig } from "../../src/wrappers/MockWrapperMultiSign";
import { wrapContractUsingMockDataPackages } from "../../src/helpers/test-utils";

interface NumbersManyDataFeedsTestParams {
  mockDataPackagesSuite: IMockDataPackagesSuite;
}

const describeConsumerNumericTestsManyDataFeeds = ({
  mockDataPackagesSuite,
}: NumbersManyDataFeedsTestParams) => {
  describe("SampleRedstoneConsumerNumericMockManyDataFeeds", function () {
    let contract: SampleRedstoneConsumerNumericMockManyDataFeeds;

    const testShouldPass = async (
      mockNumericPackages:
        | MockDataPackageConfig[]
        | MockMultiSignDataPackageConfig,
      dataFeedIds: ("ETH" | "BTC")[]
    ) => {
      const wrappedContract = wrapContractUsingMockDataPackages(
        contract,
        mockNumericPackages
      );

      const tx = await wrappedContract.save2ValuesInStorage([
        utils.convertStringToBytes32(dataFeedIds[0]),
        utils.convertStringToBytes32(dataFeedIds[1]),
      ]);
      await tx.wait();

      const firstValueFromContract = await contract.firstValue();
      const secondValueFromContract = await contract.secondValue();

      expect(firstValueFromContract.toNumber()).to.be.equal(
        expectedNumericValues[dataFeedIds[0]]
      );
      expect(secondValueFromContract.toNumber()).to.be.equal(
        expectedNumericValues[dataFeedIds[1]]
      );
    };

    const testShouldRevertWith = async (
      mockNumericPackages:
        | MockDataPackageConfig[]
        | MockMultiSignDataPackageConfig,
      dataFeedIds: string[],
      revertMsg: string
    ) => {
      const wrappedContract = wrapContractUsingMockDataPackages(
        contract,
        mockNumericPackages
      );

      await expect(
        wrappedContract.save2ValuesInStorage(
          dataFeedIds.map(utils.convertStringToBytes32)
        )
      ).to.be.revertedWith(revertMsg);
    };

    this.beforeEach(async () => {
      const ContractFactory = await ethers.getContractFactory(
        "SampleRedstoneConsumerNumericMockManyDataFeeds"
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
        "InsufficientNumberOfUniqueSigners(0, 10)"
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
        "InsufficientNumberOfUniqueSigners(9, 10)"
      );
    });

    it("Should revert for duplicated packages (not enough unique signers)", async () => {
      await testShouldRevertWith(
        mockDataPackagesSuite.mockDataPackagesWithDuplicateSigner,
        ["BTC", "ETH"],
        "InsufficientNumberOfUniqueSigners(9, 10)"
      );
    });

    if (Array.isArray(mockDataPackagesSuite.mockDataPackages)) {
      it("Should revert for enough data packages but insufficient number of one data feed id", async () => {
        const newMockPackages = [
          ...(mockDataPackagesSuite.mockDataPackages as MockDataPackageConfig[]),
        ];
        newMockPackages[1] = getMockNumericPackage({
          ...mockNumericPackageConfigs[1],
          dataPoints: [mockNumericPackageConfigs[1].dataPoints[0]],
        });
        await testShouldRevertWith(
          newMockPackages,
          ["BTC", "ETH"],
          "InsufficientNumberOfUniqueSigners(9, 10)"
        );
      });

      it("Should properly execute transaction with 20 single packages (10 for ETH and 10 for BTC)", async () => {
        const mockSinglePackageConfigs: MockNumericPackageArgs[] = [
          ...getRange({
            start: 0,
            length: NUMBER_OF_MOCK_NUMERIC_SIGNERS,
          }).map((mockSignerIndex: any) => ({
            mockSignerIndex,
            dataPoints: [
              { dataFeedId: "BTC", value: 400 },
              { dataFeedId: "SOME OTHER ID", value: 123 },
            ],
          })),
          ...getRange({
            start: 0,
            length: NUMBER_OF_MOCK_NUMERIC_SIGNERS,
          }).map((mockSignerIndex: any) => ({
            mockSignerIndex,
            dataPoints: [
              { dataFeedId: "ETH", value: 42 },
              { dataFeedId: "SOME OTHER ID", value: 345 },
            ],
          })),
        ];
        const mockSinglePackages = mockSinglePackageConfigs.map(
          getMockNumericPackage
        );
        await testShouldPass(mockSinglePackages, ["BTC", "ETH"]);
      });
    }
  });
};

describe("SampleRedstoneConsumerNumericMockManyDataFeedsSingleSign", () => {
  describeConsumerNumericTestsManyDataFeeds({
    mockDataPackagesSuite: new MockNumericDataPackagesSingleSignSuite(),
  });
});

describe("SampleRedstoneConsumerNumericMockManyDataFeedsMultiSign", () => {
  describeConsumerNumericTestsManyDataFeeds({
    mockDataPackagesSuite: new MockNumericDataPackagesMultiSignSuite(),
  });
});
