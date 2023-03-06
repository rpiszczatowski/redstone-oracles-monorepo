import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { Contract } from "ethers";
import { formatBytes32String } from "ethers/lib/utils";
import { ethers, network } from "hardhat";
import { PriceFeedsManagerMock } from "../../typechain-types";
import {
  dataFeedsIds,
  getWrappedContract,
  btcDataFeed,
  ethDataFeed,
} from "./helpers";

chai.use(chaiAsPromised);

describe("PriceFeedsManager", () => {
  let contract: PriceFeedsManagerMock;
  let wrappedContract: Contract;
  let timestamp: number;

  before(async () => {
    await network.provider.send("hardhat_reset");
  });

  beforeEach(async () => {
    const MangerContractFactory = await ethers.getContractFactory(
      "PriceFeedsManagerMock"
    );
    contract = await MangerContractFactory.deploy(dataFeedsIds);
    await contract.deployed();
    timestamp = Date.now();
    wrappedContract = getWrappedContract(contract, timestamp);
    await wrappedContract.updateDataFeedValues(1, timestamp, dataFeedsIds);
  });

  it("should properly initialize", async () => {
    const [round, lastUpdateTimestamp] = await contract.getLastRoundParams();
    expect(round).to.be.equal(1);
    expect(lastUpdateTimestamp).to.be.equal(timestamp);
  });

  it("should return if invalid proposed round", async () => {
    await wrappedContract.updateDataFeedValues(0, timestamp, dataFeedsIds);
    const [round, lastUpdateTimestamp] = await contract.getLastRoundParams();
    expect(round).to.be.equal(1);
    expect(lastUpdateTimestamp).to.be.equal(timestamp);
  });

  it("should revert if proposed timestamp smaller than last update", async () => {
    const smallerTimestamp = timestamp - 1000;
    await expect(
      wrappedContract.updateDataFeedValues(2, smallerTimestamp, dataFeedsIds)
    ).to.be.rejectedWith(
      `ProposedTimestampSmallerOrEqualToLastTimestamp(${smallerTimestamp}, ${timestamp})`
    );
  });

  it("should revert if proposed timestamp is not the same as received", async () => {
    const newTimestamp = timestamp + 1000;
    const timestampNotEqualToReceived = timestamp + 1050;
    wrappedContract = getWrappedContract(contract, newTimestamp);
    await expect(
      wrappedContract.updateDataFeedValues(
        2,
        timestampNotEqualToReceived,
        dataFeedsIds
      )
    ).to.be.rejectedWith(
      `ProposedTimestampDoesNotMatchReceivedTimestamp(${timestampNotEqualToReceived}, ${newTimestamp})`
    );
  });

  it("should revert if invalid number of data feeds to update", async () => {
    const newTimestamp = timestamp + 1000;
    wrappedContract = getWrappedContract(contract, newTimestamp);
    await expect(
      wrappedContract.updateDataFeedValues(2, newTimestamp, [ethDataFeed])
    ).to.be.rejectedWith(
      `InvalidNumberOfDataFeedsToUpdate(${dataFeedsIds.length}, 1)`
    );
  });

  it("should revert if invalid data feeds to update", async () => {
    const newTimestamp = timestamp + 1000;
    wrappedContract = getWrappedContract(contract, newTimestamp);
    const dataFeedsIdsToUpdate = [
      ethDataFeed,
      formatBytes32String("InvalidToken"),
    ];
    await expect(
      wrappedContract.updateDataFeedValues(
        2,
        newTimestamp,
        dataFeedsIdsToUpdate
      )
    ).to.be.rejectedWith(
      `InvalidDataFeedsIdsToUpdate(["${ethDataFeed}", "${formatBytes32String(
        "InvalidToken"
      )}"])`
    );
  });

  it("should update price feeds and get value for data feeds", async () => {
    const newTimestamp = timestamp + 1000;
    wrappedContract = getWrappedContract(contract, newTimestamp);
    const dataFeedsIdsToUpdate = await contract.getDataFeedsIds();
    await wrappedContract.updateDataFeedValues(
      2,
      newTimestamp,
      dataFeedsIdsToUpdate
    );
    const [round, lastUpdateTimestamp] = await contract.getLastRoundParams();
    expect(round).to.be.equal(2);
    expect(lastUpdateTimestamp).to.be.equal(newTimestamp);
    const dataFeedsValues = await contract.getValuesForDataFeeds(dataFeedsIds);
    expect(dataFeedsValues[1][0]).to.be.equal(167099000000);
    expect(dataFeedsValues[1][1]).to.be.equal(2307768000000);
    const dataFeedValueAndRoundParams =
      await contract.getValueForDataFeedAndLastRoundParams(btcDataFeed);
    expect(dataFeedValueAndRoundParams[0]).to.be.equal(2307768000000);
    expect(dataFeedValueAndRoundParams[1]).to.be.equal(2);
    expect(dataFeedValueAndRoundParams[2]).to.be.equal(newTimestamp);
  });

  it("should add new data feed", async () => {
    const newDataFeedId = formatBytes32String("NewToke");
    await contract.addDataFeedId(newDataFeedId);
    const dataFeeds = await contract.getDataFeedsIds();
    expect(dataFeeds.length).to.be.equal(3);
    expect(dataFeeds[2]).to.be.equal(newDataFeedId);
  });
});
