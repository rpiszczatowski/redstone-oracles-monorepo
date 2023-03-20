import { expect } from "chai";
import { BigNumber } from "ethers";
import { formatBytes32String } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { WrapperBuilder } from "../src/index";
import { Benchmark } from "../typechain-types";

// This test is used in monorepo intergration tests
describe("Local mock test", function () {
  let contract: Benchmark;
  const bytes32Symbols = ["ETH", "BTC", "AAVE"].map(formatBytes32String);

  const testShouldPass = async (dataFeedIds?: string[]) => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingDataService(
      {
        dataServiceId: "mock-data-service",
        uniqueSignersCount: 1,
        dataFeeds: dataFeedIds,
      },
      ["http://localhost:3000"]
    );
    const oracleValues = await wrappedContract.extractOracleValuesView(
      bytes32Symbols
    );
    checkValues(oracleValues);
  };

  const checkValues = (values: BigNumber[]) => {
    const expectedValues = [1500, 16000, 42];
    expect(values.length === expectedValues.length);
    for (let i = 0; i < values.length; i++) {
      expect(values[i]).to.eq(BigNumber.from(expectedValues[i] * 10 ** 8));
    }
  };

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory("Benchmark");
    contract = await ContractFactory.deploy();
    await contract.deployed();
    await contract.updateUniqueSignersThreshold(1);
  });

  it("Should properly extract prices with small data packages", async () => {
    await testShouldPass(["ETH", "BTC", "AAVE"]);
  });

  it("Should properly extract prices with big data packages", async () => {
    await testShouldPass();
  });
});
