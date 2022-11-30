import { ethers } from "hardhat";
import { SampleRedstoneDefaultsLib } from "../../typechain-types";
import { expect } from "chai";
import { BigNumber } from "ethers";

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
    const currentDate = new Date();
    await contract.validateTimestamp(currentDate.getTime());
    const datePlusHalfMinute = currentDate;
    datePlusHalfMinute.setSeconds(datePlusHalfMinute.getSeconds() + 30);
    await contract.validateTimestamp(datePlusHalfMinute.getTime());
    const dateMinusTwoHalfMinute = currentDate;
    dateMinusTwoHalfMinute.setMinutes(dateMinusTwoHalfMinute.getMinutes() - 2);
    dateMinusTwoHalfMinute.setSeconds(dateMinusTwoHalfMinute.getSeconds() - 30);
    await contract.validateTimestamp(dateMinusTwoHalfMinute.getTime());
  });

  it("Should revert for too old timestamp", async () => {
    const dateMinusFourMinute = new Date();
    dateMinusFourMinute.setMinutes(dateMinusFourMinute.getMinutes() - 4);
    await expect(
      contract.validateTimestamp(dateMinusFourMinute.getTime())
    ).to.be.revertedWith("TimestampIsTooOld");
  });

  it("Should revert for timestamp from too long future", async () => {
    const datePlusTwoMinute = new Date();
    datePlusTwoMinute.setMinutes(datePlusTwoMinute.getMinutes() + 2);
    await expect(
      contract.validateTimestamp(datePlusTwoMinute.getTime())
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

  it("Should properly aggregate an array with 4 values", async () => {
    const aggregatedValue = await contract.aggregateValues([38, 44, 40, 100]);
    expect(aggregatedValue.toNumber()).to.eql(42);
  });

  it("Should properly aggregate an array with values, which include a very big number", async () => {
    const aggregatedValue = await contract.aggregateValues([
      44,
      BigNumber.from("1000000000000000000000000000000000000"),
      40,
      10,
    ]);
    expect(aggregatedValue.toNumber()).to.eql(42);
  });

  it("Should properly aggregate an array with values, which include zeros", async () => {
    const aggregatedValue = await contract.aggregateValues([
      44, 0, 68, 0, 100, 0, 42,
    ]);
    expect(aggregatedValue.toNumber()).to.eql(42);
  });

  it("Should revert trying to aggregate an empty array", async () => {
    await expect(contract.aggregateValues([])).to.be.revertedWith(
      "CanNotPickMedianOfEmptyArray"
    );
  });
});
