import { ethers } from "hardhat";
import { expect } from "chai";
import {
  SampleStorageProxyConsumer,
  SampleStorageProxy,
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
import { Contract } from "ethers";

const dataFeedIdsBytes = manyAssetsDataPoints.map((dataPoint) => {
  return convertStringToBytes32(dataPoint.dataFeedId);
});

interface ProxyStorageTestParams {
  mockDataPackagesSuite: IMockDataPackagesSuite;
  testSuiteDescription: string;
}

const describeStorageProxyTests = ({
  mockDataPackagesSuite,
  testSuiteDescription,
}: ProxyStorageTestParams) => {
  describe(testSuiteDescription, function () {
    let contract: SampleStorageProxy;
    let consumerContract: SampleStorageProxyConsumer;
    let wrappedContract: Contract;
    const ethDataFeedId = convertStringToBytes32("ETH");

    this.beforeEach(async () => {
      const SampleStorageFactory = await ethers.getContractFactory(
        "SampleStorageProxy"
      );
      contract = await SampleStorageFactory.deploy();
      await contract.deployed();

      const SampleStorageProxyConsumer = await ethers.getContractFactory(
        "SampleStorageProxyConsumer"
      );

      consumerContract = await SampleStorageProxyConsumer.deploy(
        contract.address
      );
      await consumerContract.deployed();

      await contract.register(consumerContract.address);

      wrappedContract = wrapContractUsingMockDataPackages(
        contract,
        mockDataPackagesSuite.mockDataPackagesWithManyAssets
      );
    });

    it("Should return correct oracle value for one asset using dry run", async () => {
      const fetchedValue = await wrappedContract.fetchValueUsingProxyDryRun(
        ethDataFeedId
      );

      expect(fetchedValue).to.eq(expectedNumericValues.ETH);
    });

    it("Should return correct structure containing oracle value using dry run", async () => {
      const fetchedValue = await wrappedContract.fetchStructUsingProxyDryRun(
        ethDataFeedId
      );

      const expectedValue = [
        "sample",
        ethers.BigNumber.from(expectedNumericValues.ETH),
      ];

      expect(fetchedValue).to.deep.equal(expectedValue);
    });

    it("Should return correct oracle values for array of values using dry run", async () => {
      const dataValues = manyAssetsDataPoints.map((dataPoint) =>
        ethers.BigNumber.from(dataPoint.value * 10 ** 8)
      );

      const fetchedValues = await wrappedContract.fetchValuesUsingProxyDryRun(
        dataFeedIdsBytes
      );

      expect(dataValues).to.deep.eq(fetchedValues);
    });

    it("Should return correct array of structures containing oracle values using dry run", async () => {
      const fetchedValues =
        await wrappedContract.fetchArrayOfStructsUsingProxyDryRun(
          dataFeedIdsBytes
        );

      const dataValues = manyAssetsDataPoints.map((dataPoint) => [
        "sample",
        ethers.BigNumber.from(dataPoint.value * 10 ** 8),
      ]);

      expect(dataValues).to.deep.eq(fetchedValues);
    });

    it("Should return correct structure of arrays containing oracle values using dry run", async () => {
      const fetchedValues =
        await wrappedContract.fetchStructOfArraysUsingProxyDryRun(
          dataFeedIdsBytes
        );

      const names = manyAssetsDataPoints.map((dataPoint) => "sample");
      const values = manyAssetsDataPoints.map((dataPoint) =>
        ethers.BigNumber.from(dataPoint.value * 10 ** 8)
      );

      const dataValuesArray = [names, values];

      expect(dataValuesArray).to.deep.eq(fetchedValues);
    });

    it("Should return correct oracle value for one asset", async () => {
      await wrappedContract.saveOracleValueInContractStorage(ethDataFeedId);

      const fetchedValue = await consumerContract.getOracleValue(ethDataFeedId);
      expect(fetchedValue).to.eq(expectedNumericValues.ETH);
    });

    it("Should return correct oracle values for 10 assets", async () => {
      for (const dataPoint of manyAssetsDataPoints) {
        await wrappedContract.saveOracleValueInContractStorage(
          convertStringToBytes32(dataPoint.dataFeedId)
        );
        await expect(
          consumerContract.checkOracleValue(
            convertStringToBytes32(dataPoint.dataFeedId),
            Math.round(dataPoint.value * 10 ** 8)
          )
        ).not.to.be.reverted;
      }
    });

    it("Should return correct oracle values for 10 assets simultaneously", async () => {
      const dataValues = manyAssetsDataPoints.map((dataPoint) =>
        Math.round(dataPoint.value * 10 ** 8)
      );

      await wrappedContract.saveOracleValuesInContractStorage(dataFeedIdsBytes);
      await expect(
        consumerContract.checkOracleValues(dataFeedIdsBytes, dataValues)
      ).not.to.be.reverted;
    });
  });
};

describeStorageProxyTests({
  mockDataPackagesSuite: new MockNumericDataPackagesSingleSignSuite(),
  testSuiteDescription: "SampleStorageProxySingleSign",
});

describeStorageProxyTests({
  mockDataPackagesSuite: new MockNumericDataPackagesMultiSignSuite(),
  testSuiteDescription: "SampleStorageProxyMultiSign",
});
