import { ethers } from "hardhat";
import { SampleRedstoneDefaultsLib } from "../../typechain-types";
import { expect } from "chai";

const MILLISECONDS_IN_MINUTE = 60 * 1000;

describe("SampleRedstoneDefaultsLib", function () {
  let contract: SampleRedstoneDefaultsLib;

  beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneDefaultsLib"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly validate valid timestamps", async () => {
    await contract.validateTimestamp(Date.now());
    await contract.validateTimestamp(Date.now() + 0.5 * MILLISECONDS_IN_MINUTE);
    await contract.validateTimestamp(Date.now() - 2.5 * MILLISECONDS_IN_MINUTE);
  });

  it("Should revert for too old timestamp", async () => {
    await expect(
      contract.validateTimestamp(Date.now() - 4 * MILLISECONDS_IN_MINUTE)
    ).to.be.revertedWith("TimestampIsTooOld");
  });

  it("Should revert for timestamp from too long future", async () => {
    await expect(
      contract.validateTimestamp(Date.now() + 2 * MILLISECONDS_IN_MINUTE)
    ).to.be.revertedWith("TimestampFromTooLongFuture");
  });

  it("Should properly aggregate an array with 1 value", async () => {
    const aggregatedValue = await contract.aggregateValues([42]);
    expect(aggregatedValue.toNumber()).to.eql(42);
  });

  it("Should properly aggregate an array with 3 values", async () => {
    const aggregatedValue = await contract.aggregateValues([41, 43, 42]);
    expect(aggregatedValue.toNumber()).to.eql(42);
  });

  it("Should revert trying to aggregate an empty array", async () => {
    await expect(contract.aggregateValues([])).to.be.revertedWith(
      "CanNotPickMedianOfEmptyArray"
    );
  });
});
