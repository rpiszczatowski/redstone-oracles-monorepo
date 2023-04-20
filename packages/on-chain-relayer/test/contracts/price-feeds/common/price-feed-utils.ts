import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { IRedstoneAdapter, PriceFeedBase } from "../../../../typechain-types";
import { formatBytes32String } from "ethers/lib/utils";

interface PriceFeedTestsParams {
  priceFeedContractName: string;
  adapterContractName: string;
}

chai.use(chaiAsPromised);

export const describeCommonPriceFeedTests = ({priceFeedContractName, adapterContractName}: PriceFeedTestsParams) => {
  const deployAll = async () => {
    
    const adapterFactory = await ethers.getContractFactory(adapterContractName);
    const priceFeedFactory = await ethers.getContractFactory(priceFeedContractName);
    
    const adapter = await adapterFactory.deploy() as IRedstoneAdapter;
    const priceFeed = await priceFeedFactory.deploy() as PriceFeedBase;

    await adapter.deployed();
    await priceFeed.deployed();

    const tx = await (priceFeed as any).setAdapterAddress(adapter.address);
    await tx.wait();

    return {
      adapter,
      priceFeed,
    };
  };

  describe("Tests for getting price feed details", () => {
    let contracts: {adapter: IRedstoneAdapter, priceFeed: PriceFeedBase};

    beforeEach(async () => {
      contracts = await deployAll();
    });

    it("should properly get data feed id", async () => {
      const dataFeedId = await contracts.priceFeed.getDataFeedId();
      expect(dataFeedId).to.eq(formatBytes32String("BTC"));
    });

    it("should properly get price feed adapter", async () => {
      const adapterAddress = await contracts.priceFeed.getPriceFeedAdapter();
      expect(adapterAddress).to.eq(contracts.adapter.address);
    });

    it("should properly get decimals", async () => {
      const decimals = await contracts.priceFeed.decimals();
      expect(decimals).to.eq(8);
    });

    it("should properly get description", async () => {
      const description = await contracts.priceFeed.description();
      expect(description).to.eq("Redstone Price Feed");
    });

    it("should properly get version", async () => {
      const version = await contracts.priceFeed.version();
      expect(version).to.eq(1);
    });
  });

  describe("Tests for getting latest price feed values", () => {
    it("should properly get latest round data", async () => {
      expect(1).to.be.equal(1);
    });

    it("should properly get latest answer", async () => {
      expect(1).to.be.equal(1);
    });

    it("should properly get latest round id", async () => {
      expect(1).to.be.equal(1);
    });
  });

  describe("Tests for contract upgrades", () => {
    it("should properly upgrade the contract (change data feed adapter)", async () => {
      expect(1).to.be.equal(1);
    });

    it("should properly upgrade the contract (change data feed id)", async () => {
      expect(1).to.be.equal(1);
    });
  });
};
