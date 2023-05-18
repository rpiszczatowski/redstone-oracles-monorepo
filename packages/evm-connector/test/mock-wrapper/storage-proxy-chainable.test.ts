import { ethers } from "hardhat";
import { expect } from "chai";
import {
  SampleChainableStorageProxyConsumer,
  SampleChainableStorageProxy,
} from "../../typechain-types";
import { convertStringToBytes32 } from "redstone-protocol/src/common/utils";
import {
  expectedNumericValues,
  MockNumericDataPackagesMultiSignSuite,
  MockNumericDataPackagesSingleSignSuite,
  IMockDataPackagesSuite,
  manyAssetsDataPoints,
} from "../tests-common";
import { wrapContractUsingMockDataPackages } from "../../src/helpers/test-utils";
import { MockDataPackageConfig } from "../../src/wrappers/MockWrapper";
import { MockMultiSignDataPackageConfig } from "../../src/wrappers/MockWrapperMultiSign";

interface StorageProxyChainableTestParams {
  mockDataPackagesSuite: IMockDataPackagesSuite;
  testSuiteDescription: string;
}

const describeStorageProxyChainableTests = ({
  mockDataPackagesSuite,
  testSuiteDescription,
}: StorageProxyChainableTestParams) => {
  describe(testSuiteDescription, function () {
    let contract: SampleChainableStorageProxy;
    let consumerContract: SampleChainableStorageProxyConsumer;

    const testShouldPass = async (
      mockNumericPackages:
        | MockDataPackageConfig[]
        | MockMultiSignDataPackageConfig,
      dataFeedIds: string[],
      expectedValue: number
    ) => {
      const wrappedContract = wrapContractUsingMockDataPackages(
        contract,
        mockNumericPackages
      );

      const dataFeedIdsBytes = dataFeedIds.map(convertStringToBytes32);

      await wrappedContract.processOracleValues(dataFeedIdsBytes);

      const fetchedValue = await consumerContract.getComputationResult();
      expect(fetchedValue).to.eq(expectedValue);
    };

    this.beforeEach(async () => {
      const SampleChainableStorageFactory = await ethers.getContractFactory(
        "SampleChainableStorageProxy"
      );
      contract = await SampleChainableStorageFactory.deploy();
      await contract.deployed();

      const SampleChainableStorageProxyConsumer =
        await ethers.getContractFactory("SampleChainableStorageProxyConsumer");

      const contractB = await SampleChainableStorageProxyConsumer.deploy(
        contract.address
      );
      await contractB.deployed();

      consumerContract = await SampleChainableStorageProxyConsumer.deploy(
        contract.address
      );
      await consumerContract.deployed();

      await contract.register(contractB.address);
      await contractB.register(consumerContract.address);
    });

    it("Should process oracle value for one asset", async () => {
      await testShouldPass(
        mockDataPackagesSuite.mockDataPackagesWithManyAssets,
        ["ETH"],
        expectedNumericValues.ETH * 42
      );
    });

    it("Should process oracle values for 10 assets", async () => {
      const wrappedContract = wrapContractUsingMockDataPackages(
        contract,
        mockDataPackagesSuite.mockDataPackagesWithManyAssets
      );

      const dataValues = manyAssetsDataPoints.map((dataPoint) =>
        Math.round(dataPoint.value * 10 ** 8)
      );

      const expectedValue = dataValues.reduce((a, b) => a + b, 0) * 42;

      for (const dataPoint of manyAssetsDataPoints) {
        await wrappedContract.processOracleValue(
          convertStringToBytes32(dataPoint.dataFeedId)
        );
      }

      const computationResult = await consumerContract.getComputationResult();
      expect(computationResult).to.eq(expectedValue);
    });

    it("Should process oracle values for 10 assets simultaneously", async () => {
      const dataValues = manyAssetsDataPoints.map((dataPoint) =>
        Math.round(dataPoint.value * 10 ** 8)
      );
      const expectedValue = dataValues.reduce((a, b) => a + b, 0) * 42;

      await testShouldPass(
        mockDataPackagesSuite.mockDataPackagesWithManyAssets,
        manyAssetsDataPoints.map((dp) => dp.dataFeedId),
        expectedValue
      );
    });
  });
};

describeStorageProxyChainableTests({
  mockDataPackagesSuite: new MockNumericDataPackagesSingleSignSuite(),
  testSuiteDescription: "SampleChainableStorageProxySingleSign",
});

describeStorageProxyChainableTests({
  mockDataPackagesSuite: new MockNumericDataPackagesMultiSignSuite(),
  testSuiteDescription: "SampleChainableStorageProxyMultiSign",
});
