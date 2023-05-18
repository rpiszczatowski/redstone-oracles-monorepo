import { ethers } from "hardhat";
import { SampleWithEvents } from "../../typechain-types";
import { expect } from "chai";
import { Event } from "ethers";
import {
  IMockDataPackagesSuite,
  MockNumericDataPackagesMultiSignSuite,
  MockNumericDataPackagesSingleSignSuite,
} from "../tests-common";
import { wrapContractUsingMockDataPackages } from "../../src/helpers/test-utils";

interface EventsTestParams {
  mockDataPackagesSuite: IMockDataPackagesSuite;
  testSuiteDescription: string;
}

const describeEventsTests = ({
  mockDataPackagesSuite,
  testSuiteDescription,
}: EventsTestParams) => {
  describe(testSuiteDescription, function () {
    let sampleContract: SampleWithEvents;

    beforeEach(async () => {
      const SampleWithEvents = await ethers.getContractFactory(
        "SampleWithEvents"
      );
      sampleContract = await SampleWithEvents.deploy();
    });

    it("Test events with contract wrapping", async function () {
      // Wrapping the contract instance
      const wrappedContract = wrapContractUsingMockDataPackages(
        sampleContract,
        mockDataPackagesSuite.mockDataPackages
      );

      // Sending tx
      const tx = await wrappedContract.emitEventWithLatestOracleValue();
      const receipt = await tx.wait();
      const event: Event = receipt.events![0];

      // Receipt should have parsed events
      expect(receipt.events!.length).to.be.equal(1);
      expect(event.args!._updatedValue!.toNumber()).to.be.gt(0);
      expect(event.event).to.be.equal("ValueUpdated");
    });
  });
};

describeEventsTests({
  mockDataPackagesSuite: new MockNumericDataPackagesSingleSignSuite(),
  testSuiteDescription: "SampleWithEventsSingleSign",
});

describeEventsTests({
  mockDataPackagesSuite: new MockNumericDataPackagesMultiSignSuite(),
  testSuiteDescription: "SampleWithEventsMultiSign",
});
