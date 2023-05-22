import chai, { expect } from "chai";
import { ethers } from "hardhat";
import { SampleRedstoneConsumerNumericMock } from "../../typechain-types";
import { utils } from "redstone-protocol";
import {
  IMockDataPackagesSuite,
  MockNumericDataPackagesSingleSignSuite,
  MockNumericDataPackagesMultiSignSuite,
} from "../tests-common";
import { wrapContractUsingMockDataPackages } from "../../src/helpers/test-utils";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

const DATA_FEED_ID = utils.convertStringToBytes32("ETH");
const EXPECTED_DATA_FEED_VALUE = 4200000000;

interface SignerOrProviderTestParams {
  mockDataPackagesSuite: IMockDataPackagesSuite;
  testSuiteDescription: string;
}

const describeSignerOrProviderTests = ({
  mockDataPackagesSuite,
  testSuiteDescription,
}: SignerOrProviderTestParams) => {
  describe(testSuiteDescription, function () {
    let deployedContract: SampleRedstoneConsumerNumericMock;

    this.beforeEach(async () => {
      const ContractFactory = await ethers.getContractFactory(
        "SampleRedstoneConsumerNumericMock"
      );
      deployedContract = await ContractFactory.deploy();
      await deployedContract.deployed();
    });

    it("Should call static function without signer", async () => {
      const contract = deployedContract.connect(ethers.provider);

      const wrappedContract = wrapContractUsingMockDataPackages(
        contract,
        mockDataPackagesSuite.mockDataPackages
      );

      const response = await wrappedContract.getValueForDataFeedId(
        DATA_FEED_ID
      );
      expect(response.toNumber()).to.equal(EXPECTED_DATA_FEED_VALUE);
    });

    it("Should revert with non-static function without signer", async () => {
      const contract = deployedContract.connect(ethers.provider);

      const wrappedContract = wrapContractUsingMockDataPackages(
        contract,
        mockDataPackagesSuite.mockDataPackages
      );

      await expect(
        wrappedContract.saveOracleValueInContractStorage(DATA_FEED_ID)
      ).to.be.rejectedWith(
        "Cannot read properties of null (reading 'sendTransaction')"
      );
    });

    it("Should call non-static function with signer", async () => {
      const wrappedContract = wrapContractUsingMockDataPackages(
        deployedContract,
        mockDataPackagesSuite.mockDataPackages
      );
      const tx = await wrappedContract.saveOracleValueInContractStorage(
        DATA_FEED_ID
      );
      await tx.wait();
    });
  });
};

describeSignerOrProviderTests({
  mockDataPackagesSuite: new MockNumericDataPackagesSingleSignSuite(),
  testSuiteDescription: "SignerOrProviderTestsSingleSign",
});

describeSignerOrProviderTests({
  mockDataPackagesSuite: new MockNumericDataPackagesMultiSignSuite(),
  testSuiteDescription: "SignerOrProviderTestsMultiSign",
});
