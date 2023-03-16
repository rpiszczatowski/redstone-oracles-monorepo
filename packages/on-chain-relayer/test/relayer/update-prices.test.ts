import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { PriceFeedsAdapterMock } from "../../typechain-types";
import { updatePrices } from "../../src/core/contract-interactions/update-prices";
import { getLastRoundParamsFromContract } from "../../src/core/contract-interactions/get-last-round-params";
import { server } from "./mock-server";
import {
  dataFeedsIds,
  getDataPackagesResponse,
  mockEnvVariables,
} from "../helpers";

chai.use(chaiAsPromised);

describe("#updatePrices", () => {
  before(() => {
    mockEnvVariables();
    server.listen();
  });

  beforeEach(async () => {});

  afterEach(() => server.resetHandlers());
  after(() => server.close());

  it("should update price in price-feeds adapter", async () => {
    // Deploy contract
    const PriceFeedsAdapterFactory = await ethers.getContractFactory(
      "PriceFeedsAdapterMock"
    );
    const priceFeedsAdapter: PriceFeedsAdapterMock =
      await PriceFeedsAdapterFactory.deploy(dataFeedsIds);
    await priceFeedsAdapter.deployed();

    // Update prices
    const { lastRound, lastUpdateTimestamp } =
      await getLastRoundParamsFromContract(priceFeedsAdapter);
    const dataPackages = getDataPackagesResponse();
    await updatePrices(
      dataPackages,
      priceFeedsAdapter,
      lastRound,
      lastUpdateTimestamp
    );

    // Check updated values
    const [round] = await priceFeedsAdapter.getLastRoundParams();
    expect(round).to.be.equal(1);
    const dataFeedsValues = await priceFeedsAdapter.getValuesForDataFeeds(
      dataFeedsIds
    );
    expect(dataFeedsValues[0]).to.be.equal(167099000000);
    expect(dataFeedsValues[1]).to.be.equal(2307768000000);
  });

  // it("should update prices in mento adapter", async () => {

  // });
});
