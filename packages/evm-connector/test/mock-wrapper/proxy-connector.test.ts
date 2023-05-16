import { ethers } from "hardhat";
import { expect } from "chai";
import { SampleProxyConnector } from "../../typechain-types";
import { convertStringToBytes32 } from "redstone-protocol/src/common/utils";
import {
  expectedNumericValues,
  IMockDataPackagesSuite,
  MockNumericDataPackagesMultiSignSuite,
  MockNumericDataPackagesSingleSignSuite,
  manyAssetsDataPoints,
} from "../tests-common";
import { MockDataPackageConfig } from "../../src/wrappers/MockWrapper";
import { MockMultiSignDataPackageConfig } from "../../src/wrappers/MockWrapperMultiSign";
import { wrapContractUsingMockDataPackages } from "../../src/helpers/test-utils";

interface ProxyConnectorTestParams {
  mockDataPackagesSuite: IMockDataPackagesSuite;
}

const describeProxyConnectorTests = ({
  mockDataPackagesSuite,
}: ProxyConnectorTestParams) => {
  describe("SampleProxyConnector", function () {
    let contract: SampleProxyConnector;
    const ethDataFeedId = convertStringToBytes32("ETH");

    const testShouldRevertWith = async (
      mockPackages: MockDataPackageConfig[] | MockMultiSignDataPackageConfig,
      revertMsg: string
    ) => {
      const wrappedContract = wrapContractUsingMockDataPackages(
        contract,
        mockPackages
      );

      await expect(
        wrappedContract.getOracleValueUsingProxy(ethDataFeedId)
      ).to.be.revertedWith(revertMsg);
    };

    this.beforeEach(async () => {
      const ContractFactory = await ethers.getContractFactory(
        "SampleProxyConnector"
      );
      contract = await ContractFactory.deploy();
      await contract.deployed();
    });

    it("Should return correct oracle value for one asset", async () => {
      const wrappedContract = wrapContractUsingMockDataPackages(
        contract,
        mockDataPackagesSuite.mockDataPackages
      );

      const fetchedValue = await wrappedContract.getOracleValueUsingProxy(
        ethDataFeedId
      );
      expect(fetchedValue).to.eq(expectedNumericValues.ETH);
    });

    it("Should return correct oracle values for 10 assets", async () => {
      const wrappedContract = wrapContractUsingMockDataPackages(
        contract,
        mockDataPackagesSuite.mockDataPackagesWithManyAssets
      );

      for (const dataPoint of manyAssetsDataPoints) {
        await expect(
          wrappedContract.checkOracleValue(
            convertStringToBytes32(dataPoint.dataFeedId),
            Math.round(dataPoint.value * 10 ** 8)
          )
        ).not.to.be.reverted;
      }
    });

    it("Should forward msg.value", async () => {
      const wrappedContract = wrapContractUsingMockDataPackages(
        contract,
        mockDataPackagesSuite.mockDataPackages
      );

      await expect(
        wrappedContract.requireValueForward({
          value: ethers.utils.parseUnits("2137"),
        })
      ).not.to.be.reverted;
    });

    it("Should work properly with long encoded functions", async () => {
      const wrappedContract = wrapContractUsingMockDataPackages(
        contract,
        mockDataPackagesSuite.mockDataPackages
      );

      await expect(
        wrappedContract.checkOracleValueLongEncodedFunction(
          ethDataFeedId,
          expectedNumericValues.ETH
        )
      ).not.to.be.reverted;
      await expect(
        wrappedContract.checkOracleValueLongEncodedFunction(ethDataFeedId, 9999)
      ).to.be.revertedWith("WrongValue()");
    });

    it("Should fail with correct message (timestamp invalid)", async () => {
      await testShouldRevertWith(
        mockDataPackagesSuite.mockDataPackagesWithTooOldTimestamp,
        `errorArgs=["0x355b8743"], errorName="ProxyCalldataFailedWithCustomError"`
      );
    });

    it("Should fail with correct message (insufficient number of unique signers)", async () => {
      await testShouldRevertWith(
        mockDataPackagesSuite.mockDataPackagesWithInsufficientNumberOfSigners,
        `errorArgs=["0x2b13aef50000000000000000000000000000000000000000000000000000000000000009000000000000000000000000000000000000000000000000000000000000000a"], errorName="ProxyCalldataFailedWithCustomError"`
      );
    });

    it("Should fail with correct message (signer is not authorised)", async () => {
      await testShouldRevertWith(
        mockDataPackagesSuite.mockDataPackagesWithUnauthorizedSigner,
        `errorArgs=["0xec459bc00000000000000000000000008626f6940e2eb28930efb4cef49b2d1f2c9c1199"], errorName="ProxyCalldataFailedWithCustomError"`
      );
    });

    it("Should fail with correct message (no error message)", async () => {
      const wrappedContract = wrapContractUsingMockDataPackages(
        contract,
        mockDataPackagesSuite.mockDataPackages
      );

      await expect(wrappedContract.proxyEmptyError()).to.be.revertedWith(
        `errorName="ProxyCalldataFailedWithoutErrMsg"`
      );
    });

    it("Should fail with correct message (string test message)", async () => {
      const wrappedContract = wrapContractUsingMockDataPackages(
        contract,
        mockDataPackagesSuite.mockDataPackages
      );

      await expect(wrappedContract.proxyTestStringError()).to.be.revertedWith(
        `errorArgs=["Test message"], errorName="ProxyCalldataFailedWithStringMessage"`
      );
    });
  });
};

describe("SampleProxyConnectorSingleSign", () => {
  describeProxyConnectorTests({
    mockDataPackagesSuite: new MockNumericDataPackagesSingleSignSuite(),
  });
});

describe("SampleProxyConnectorMultiSign", () => {
  describeProxyConnectorTests({
    mockDataPackagesSuite: new MockNumericDataPackagesMultiSignSuite(),
  });
});
