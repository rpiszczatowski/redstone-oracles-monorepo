import { expect } from "chai";
import { ethers } from "hardhat";
import { utils } from "redstone-protocol";
import {
  IMockDataPackagesSuite,
  MockNumericDataPackagesMultiSignSuite,
  MockNumericDataPackagesSingleSignSuite,
} from "../tests-common";
import { wrapContractUsingMockDataPackages } from "../../src/helpers/test-utils";
import { REDSTONE_MARKER_HEX } from "redstone-protocol/src/common/redstone-constants";

interface PopulateTransactionTestParams {
  mockDataPackagesSuite: IMockDataPackagesSuite;
  testSuiteDescription: string;
}

const describePopulateTransactionTests = ({
  mockDataPackagesSuite,
  testSuiteDescription,
}: PopulateTransactionTestParams) => {
  describe(testSuiteDescription, function () {
    it("Should overwrite populateTransaction", async () => {
      // Deploying the contract
      const ContractFactory = await ethers.getContractFactory(
        "SampleRedstoneConsumerNumericMock"
      );
      const contract = await ContractFactory.deploy();
      await contract.deployed();

      // Wrapping the contract
      const wrappedContract = wrapContractUsingMockDataPackages(
        contract,
        mockDataPackagesSuite.mockDataPackages
      );

      // Prepare calldata for original and wrapped contracts
      const dataFeedId = utils.convertStringToBytes32("ETH");
      const originalTxPopulated = await contract.populateTransaction[
        "getValueForDataFeedId"
      ](dataFeedId);
      const wrappedTxPopulated = await wrappedContract.populateTransaction[
        "getValueForDataFeedId"
      ](dataFeedId);

      // Checking the calldata
      const redstoneMarker = REDSTONE_MARKER_HEX.replace("0x", "");
      expect(originalTxPopulated.data)
        .to.be.a("string")
        .and.satisfy((str: string) => !str.endsWith(redstoneMarker));
      expect(wrappedTxPopulated.data)
        .to.be.a("string")
        .and.satisfy((str: string) => str.endsWith(redstoneMarker));
    });
  });
};

describePopulateTransactionTests({
  mockDataPackagesSuite: new MockNumericDataPackagesSingleSignSuite(),
  testSuiteDescription: "PopulateTransactionTestSingleSign",
});

describePopulateTransactionTests({
  mockDataPackagesSuite: new MockNumericDataPackagesMultiSignSuite(),
  testSuiteDescription: "PopulateTransactionTestMultiSign",
});
