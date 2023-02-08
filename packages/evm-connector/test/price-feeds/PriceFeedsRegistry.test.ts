import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { formatBytes32String, parseBytes32String } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { PriceFeedsRegistry } from "../../typechain-types";

chai.use(chaiAsPromised);

describe("PriceFeedsRegistry", () => {
  let contract: PriceFeedsRegistry;
  let contractWithNotOwner: PriceFeedsRegistry;

  beforeEach(async () => {
    const [owner, notOwner] = await ethers.getSigners();
    const ContractFactory = await ethers.getContractFactory(
      "PriceFeedsRegistry"
    );
    const address = await owner.getAddress();
    contract = await ContractFactory.deploy(address);
    contractWithNotOwner = contract.connect(notOwner);

    await contract.deployed();
  });

  it("should properly initialize", async () => {
    const dataFeeds = await contract.getDataFeeds();
    expect(dataFeeds.length).to.be.equal(13);
    const firstDataFeedId = parseBytes32String(dataFeeds[0]);
    expect(firstDataFeedId).to.be.equal("BTC");
    const sixthDataFeedId = parseBytes32String(dataFeeds[5]);
    expect(sixthDataFeedId).to.be.equal("BUSD");
  });

  it("should revert if not owner tries to add data feed", async () => {
    const dataFeedId = formatBytes32String("TestToken");
    await expect(
      contractWithNotOwner.addDataFeed(dataFeedId)
    ).to.be.rejectedWith("Ownable: caller is not the owner");
  });

  it("should revert if not owner tries to remove data feed", async () => {
    const dataFeedId = formatBytes32String("AVAX");
    await expect(
      contractWithNotOwner.addDataFeed(dataFeedId)
    ).to.be.rejectedWith("Ownable: caller is not the owner");
  });

  it("should return price feed address for data feed", async () => {
    const dataFeedId = formatBytes32String("ETH");
    const priceFeedAddress = await contract.getPriceFeedContractAddress(
      dataFeedId
    );
    expect(priceFeedAddress).to.be.string;
  });

  it("should add multiple new price feeds", async () => {
    const firstNewDataFeedId = formatBytes32String("FirstTestToken");
    const secondNewDataFeedId = formatBytes32String("SecondTestToken");
    await contract.addDataFeed(firstNewDataFeedId);
    await contract.addDataFeed(secondNewDataFeedId);
    const dataFeeds = await contract.getDataFeeds();
    expect(dataFeeds.length).to.be.equal(15);
    const newFirstDataFeed = parseBytes32String(dataFeeds[13]);
    const newSecondDataFeed = parseBytes32String(dataFeeds[14]);
    expect(newFirstDataFeed).to.be.equal("FirstTestToken");
    expect(newSecondDataFeed).to.be.equal("SecondTestToken");
  });

  it("shouldn't add price feed if exists", async () => {
    const dataFeedIdToAdd = formatBytes32String("USDC");
    await contract.addDataFeed(dataFeedIdToAdd);
    const dataFeeds = await contract.getDataFeeds();
    expect(dataFeeds.length).to.be.equal(13);
  });

  it("should remove multiple new price feeds", async () => {
    const firstDataFeedIdToDelete = formatBytes32String("USDT");
    const secondDataFeedIdToDelete = formatBytes32String("JOE");
    await contract.removeDataFeed(firstDataFeedIdToDelete);
    await contract.removeDataFeed(secondDataFeedIdToDelete);
    const dataFeeds = await contract.getDataFeeds();
    expect(dataFeeds.length).to.be.equal(11);
    await expect(
      contract.getPriceFeedContractAddress(secondDataFeedIdToDelete)
    ).to.be.rejectedWith("EnumerableMap: nonexistent key");
  });

  it("should revert if tries to remove non-existing price feeds", async () => {
    const dataFeedIdToDelete = formatBytes32String("TestToken");
    await contract.removeDataFeed(dataFeedIdToDelete);
    const dataFeeds = await contract.getDataFeeds();
    expect(dataFeeds.length).to.be.equal(13);
  });
});
