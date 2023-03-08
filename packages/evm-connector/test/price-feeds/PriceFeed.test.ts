import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { PriceFeed, PriceFeedsManager } from "../../typechain-types";
import { dataFeedsIds, ethDataFeed, getWrappedContract } from "./helpers";

chai.use(chaiAsPromised);

describe("PriceFeed", () => {
  let contract: PriceFeed;
  let managerContract: PriceFeedsManager;

  beforeEach(async () => {
    const MangerContractFactory = await ethers.getContractFactory(
      "PriceFeedsManagerMock"
    );
    managerContract = await MangerContractFactory.deploy(dataFeedsIds);
    await managerContract.deployed();

    const ContractFactory = await ethers.getContractFactory("PriceFeed");
    contract = await ContractFactory.deploy(
      managerContract.address,
      ethDataFeed,
      "RedStone price feed for TestToken"
    );

    await contract.deployed();

    const timestamp = Date.now();
    const wrappedContract = await getWrappedContract(
      managerContract,
      timestamp
    );
    await wrappedContract.updateDataFeedValues(1, timestamp);
  });

  it("should properly initialize", async () => {
    const dataFeedId = await contract.getDataFeedId();
    expect(dataFeedId).to.be.equal(ethDataFeed);
    const description = await contract.description();
    expect(description).to.be.equal("RedStone price feed for TestToken");
  });

  it("should revert if calling getRoundData", async () => {
    await expect(contract.getRoundData(0)).to.be.rejectedWith(
      "UseLatestRoundToGetDataFeedPrice"
    );
  });

  it("should store data feed value and fetch latest value", async () => {
    const latestValue = await contract.latestRoundData();
    expect(latestValue.answer).to.be.equal(167099000000);
  });
});
