import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { Contract } from "ethers";
import { ethers, network } from "hardhat";
import {
  PriceFeedsManagerMock,
  PriceFeedsRegistry,
} from "../../typechain-types";
import {
  dataFeedsIds,
  addDataFeedsToRegistry,
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
    const RegistryContractFactory = await ethers.getContractFactory(
      "PriceFeedsRegistry"
    );
    const MangerContractFactory = await ethers.getContractFactory(
      "PriceFeedsManagerMock"
    );
    contract = await MangerContractFactory.deploy();
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

  it("should update ETH price feed and get value for data feed", async () => {
    const newTimestamp = timestamp + 1000;
    wrappedContract = getWrappedContract(contract, newTimestamp);
    await wrappedContract.updateDataFeedValues(2, newTimestamp, [ethDataFeed]);
    const [round, lastUpdateTimestamp] = await contract.getLastRoundParams();
    expect(round).to.be.equal(2);
    expect(lastUpdateTimestamp).to.be.equal(newTimestamp);
    const ethValue = await contract.getValueForDataFeed(ethDataFeed);
    expect(ethValue).to.be.equal(167099000000);
  });

  it("should update ETH, BTC price feeds and get value for data feeds", async () => {
    const newTimestamp = timestamp + 1000;
    wrappedContract = getWrappedContract(contract, newTimestamp);
    await wrappedContract.updateDataFeedValues(2, newTimestamp, dataFeedsIds);
    const [round, lastUpdateTimestamp] = await contract.getLastRoundParams();
    expect(round).to.be.equal(2);
    expect(lastUpdateTimestamp).to.be.equal(newTimestamp);
    const dataFeedsValues = await contract.getValuesForDataFeeds(dataFeedsIds);
    expect(dataFeedsValues[1][0]).to.be.equal(167099000000);
    expect(dataFeedsValues[1][1]).to.be.equal(2307768000000);
  });

  it("should update BTC price feed and get value for data feed and round paras", async () => {
    const newTimestamp = timestamp + 1000;
    wrappedContract = getWrappedContract(contract, newTimestamp);
    await wrappedContract.updateDataFeedValues(2, newTimestamp, [btcDataFeed]);
    const dataFeedValueAndRoundParams =
      await contract.getValueForDataFeedAndLastRoundParas(btcDataFeed);
    expect(dataFeedValueAndRoundParams[0]).to.be.equal(2307768000000);
    expect(dataFeedValueAndRoundParams[1]).to.be.equal(2);
    expect(dataFeedValueAndRoundParams[2]).to.be.equal(newTimestamp);
  });
});
