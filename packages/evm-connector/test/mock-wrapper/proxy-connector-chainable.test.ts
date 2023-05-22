import { ethers } from "hardhat";
import { expect } from "chai";
import {
  SampleProxyConnectorConsumer,
  SampleChainableProxyConnector,
} from "../../typechain-types";
import { utils } from "redstone-protocol";
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
interface ProxyConnectorChainableTestParams {
  mockDataPackagesSuite: IMockDataPackagesSuite;
  testSuiteDescription: string;
}

const describeProxyConnectorChainableTests = ({
  mockDataPackagesSuite,
  testSuiteDescription,
}: ProxyConnectorChainableTestParams) => {
  describe(testSuiteDescription, function () {
    let contract: SampleChainableProxyConnector;
    let consumerContract: SampleProxyConnectorConsumer;

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

      const dataFeedIdsBytes = dataFeedIds.map(utils.convertStringToBytes32);

      await wrappedContract.processOracleValues(dataFeedIdsBytes);

      const fetchedValue = await consumerContract.getComputationResult();
      expect(fetchedValue).to.eq(expectedValue);
    };

    this.beforeEach(async () => {
      const ContractFactory = await ethers.getContractFactory(
        "SampleChainableProxyConnector"
      );
      contract = await ContractFactory.deploy();
      await contract.deployed();

      const contractB = await ContractFactory.deploy();
      await contractB.deployed();

      await contract.registerNextConnector(contractB.address);

      const ConsumerContractFactory = await ethers.getContractFactory(
        "SampleProxyConnectorConsumer"
      );
      consumerContract = await ConsumerContractFactory.deploy();
      await consumerContract.deployed();

      await contractB.registerConsumer(consumerContract.address);
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
          utils.convertStringToBytes32(dataPoint.dataFeedId)
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

describeProxyConnectorChainableTests({
  mockDataPackagesSuite: new MockNumericDataPackagesSingleSignSuite(),
  testSuiteDescription: "SampleChainableProxyConnectorSingleSign",
});

describeProxyConnectorChainableTests({
  mockDataPackagesSuite: new MockNumericDataPackagesMultiSignSuite(),
  testSuiteDescription: "SampleChainableProxyConnectorMultiSign",
});
