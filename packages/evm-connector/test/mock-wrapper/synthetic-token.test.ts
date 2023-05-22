import { ethers } from "hardhat";
import { SampleSyntheticToken } from "../../typechain-types";
import { expect } from "chai";
import { Signer } from "ethers";
import {
  IMockDataPackagesSuite,
  MockNumericDataPackagesMultiSignSuite,
  MockNumericDataPackagesSingleSignSuite,
  NUMBER_OF_MOCK_NUMERIC_SIGNERS,
} from "../tests-common";
import { utils } from "redstone-protocol";
import {
  getMockNumericMultiSignPackage,
  getMockNumericPackage,
  getRange,
  MockSignerIndex,
  wrapContractUsingMockDataPackages,
} from "../../src/helpers/test-utils";
import { MockDataPackageConfig } from "../../src/wrappers/MockWrapper";
import { MockMultiSignDataPackageConfig } from "../../src/wrappers/MockWrapperMultiSign";
// TODO audit: measure how many bytes do we add to the consumer contracts

interface SyntheticTokenTestParams {
  mockDataPackagesSuite: IMockDataPackagesSuite;
  testSuiteDescription: string;
}

const describeSyntheticTokenTests = ({
  mockDataPackagesSuite,
  testSuiteDescription,
}: SyntheticTokenTestParams) => {
  describe(testSuiteDescription, function () {
    let sampleContract: SampleSyntheticToken,
      wrappedContract: any,
      signer: Signer,
      address: string;

    const toEth = function (val: number) {
      return ethers.utils.parseEther(val.toString());
    };
    const toVal = function (val: number) {
      return ethers.utils.parseUnits(val.toString(), 26);
    };

    beforeEach(async () => {
      const SampleSyntheticToken = await ethers.getContractFactory(
        "SampleSyntheticToken"
      );
      sampleContract = await SampleSyntheticToken.deploy();
      await sampleContract.initialize(
        utils.convertStringToBytes32("REDSTONE"),
        "SYNTH-REDSTONE",
        "SREDSTONE"
      );
      await sampleContract.deployed();
      [signer] = await ethers.getSigners();
      address = await signer.getAddress();

      let mockDataPackages:
        | MockDataPackageConfig[]
        | MockMultiSignDataPackageConfig;
      if (Array.isArray(mockDataPackagesSuite.mockDataPackages)) {
        mockDataPackages = getRange({
          start: 0,
          length: NUMBER_OF_MOCK_NUMERIC_SIGNERS,
        }).map((i) =>
          getMockNumericPackage({
            dataPoints: [
              {
                dataFeedId: "ETH",
                value: 2000,
              },
              {
                dataFeedId: "REDSTONE",
                value: 200,
              },
            ],
            mockSignerIndex: i as MockSignerIndex,
          })
        );
      } else {
        mockDataPackages = getMockNumericMultiSignPackage({
          dataPoints: [
            {
              dataFeedId: "ETH",
              value: 2000,
            },
            {
              dataFeedId: "REDSTONE",
              value: 200,
            },
          ],
          mockSignerIndices: getRange({
            start: 0,
            length: NUMBER_OF_MOCK_NUMERIC_SIGNERS,
          }) as MockSignerIndex[],
        });
      }

      wrappedContract = wrapContractUsingMockDataPackages(
        sampleContract,
        mockDataPackages
      );
    });

    it("Maker balance should be 0", async () => {
      expect(await wrappedContract.balanceOf(address)).to.equal(0);
    });

    it("Should mint", async () => {
      const tx = await wrappedContract.mint(toEth(100), { value: toEth(20) });
      await tx.wait();

      expect(await wrappedContract.balanceOf(address)).to.equal(toEth(100));
      expect(await wrappedContract.balanceValueOf(address)).to.equal(
        toVal(20000)
      );
      expect(await wrappedContract.totalValue()).to.equal(toVal(20000));
      expect(await wrappedContract.collateralOf(address)).to.equal(toEth(20));
      expect(await wrappedContract.collateralValueOf(address)).to.equal(
        toVal(40000)
      );
      expect(await wrappedContract.debtOf(address)).to.equal(toEth(100));
      expect(await wrappedContract.debtValueOf(address)).to.equal(toVal(20000));
      expect(await wrappedContract.solvencyOf(address)).to.equal(2000);
    });
  });
};

describeSyntheticTokenTests({
  mockDataPackagesSuite: new MockNumericDataPackagesSingleSignSuite(),
  testSuiteDescription: "SampleSyntheticTokenSingleSign",
});

describeSyntheticTokenTests({
  mockDataPackagesSuite: new MockNumericDataPackagesMultiSignSuite(),
  testSuiteDescription: "SampleSyntheticTokenMultiSign",
});
