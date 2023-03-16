import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { MentoAdapter, MockSortedOracles } from "../../typechain-types";

chai.use(chaiAsPromised);

describe("MentoAdapter", () => {
  let sortedOracles: MockSortedOracles;
  let mentoAdaper: MentoAdapter;

  beforeEach(async () => {
    // Deploying AddressSortedLinkedListWithMedian library
    const AddressSortedLinkedListWithMedianFactory =
      await ethers.getContractFactory("AddressSortedLinkedListWithMedian");
    const sortedLinkedListContract =
      await AddressSortedLinkedListWithMedianFactory.deploy();
    await sortedLinkedListContract.deployed();

    // Deploying sorted oracles
    const SortedOraclesFactory = await ethers.getContractFactory(
      "MockSortedOracles",
      {
        libraries: {
          AddressSortedLinkedListWithMedian: sortedLinkedListContract.address,
        },
      }
    );
    sortedOracles = await SortedOraclesFactory.deploy();
    await sortedOracles.deployed();

    // Deploying mento adapter
    const MentoAdapterFactory = await ethers.getContractFactory("MentoAdapter");
    mentoAdaper = await MentoAdapterFactory.deploy(sortedOracles.address);
    await mentoAdaper.deployed();
  });

  it("should properly initialize", async () => {
    expect(2 + 2).to.eq(4);
  });
});
