import { ethers } from "hardhat";
import { WrapperBuilder } from "../../src/index";
import { SampleRedstoneConsumerNumericMock } from "../../typechain-types";
import { expect } from "chai";
import { mockNumericPackages } from "../tests-common";
import { DEFAULT_TIMESTAMP_FOR_TESTS } from "../../src/helpers/test-utils";

describe("Extract Timestamp", function () {
  let sampleContract: SampleRedstoneConsumerNumericMock;

  beforeEach(async () => {
    const SampleRedstoneConsumerNumericMock = await ethers.getContractFactory(
      "SampleRedstoneConsumerNumericMock"
    );
    sampleContract = await SampleRedstoneConsumerNumericMock.deploy();
  });

  it("Should extract timestamp correctly", async function () {
    // Wrapping the contract instnace
    const wrappedContract =
      WrapperBuilder.wrap(sampleContract).usingMockDataPackages(
        mockNumericPackages
      );

    const timestamp = await wrappedContract.extractTimestampFromRedstonePayload();

    expect(timestamp).to.be.equal(DEFAULT_TIMESTAMP_FOR_TESTS);
  });
});
