import { ethers } from "hardhat";
import { expect } from "chai";
import { SampleStorageProxy } from "../../typechain-types";
import { WrapperBuilder } from "../../src";
import { convertStringToBytes32 } from "redstone-protocol/src/common/utils";
import {
  expectedNumericValues,
  mockNumericPackages,
  NUMBER_OF_MOCK_NUMERIC_SIGNERS,
} from "../tests-common";
import {
  getMockNumericPackage,
  getRange,
  MockSignerIndex,
} from "../../src/helpers/test-utils";

describe("SampleStorageProxy", function () {
  let contract: SampleStorageProxy;
  const ethDataFeedId = convertStringToBytes32("ETH");

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleStorageProxy"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should return correct oracle value for one asset", async () => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockNumericPackages);

    await wrappedContract.saveOracleValueInContractStorage(ethDataFeedId);

    const fetchedValue = await wrappedContract.getOracleValueUsingProxy(
      ethDataFeedId
    );
    console.log(fetchedValue);
    expect(fetchedValue).to.eq(expectedNumericValues.ETH);
  });

  it("Should return correct oracle values for 10 assets", async () => {
    const dataPoints = [
      { dataFeedId: "ETH", value: 4000 },
      { dataFeedId: "AVAX", value: 5 },
      { dataFeedId: "BTC", value: 100000 },
      { dataFeedId: "LINK", value: 2 },
      { dataFeedId: "UNI", value: 200 },
      { dataFeedId: "FRAX", value: 1 },
      { dataFeedId: "OMG", value: 0.00003 },
      { dataFeedId: "DOGE", value: 2 },
      { dataFeedId: "SOL", value: 11 },
      { dataFeedId: "BNB", value: 31 },
    ];

    const mockNumericPackages = getRange({
      start: 0,
      length: NUMBER_OF_MOCK_NUMERIC_SIGNERS,
    }).map((i) =>
      getMockNumericPackage({
        dataPoints,
        mockSignerIndex: i as MockSignerIndex,
      })
    );

    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockNumericPackages);

    for (const dataPoint of dataPoints) {
      await wrappedContract.saveOracleValueInContractStorage(
        convertStringToBytes32(dataPoint.dataFeedId)
      );
      await expect(
        wrappedContract.checkOracleValue(
          convertStringToBytes32(dataPoint.dataFeedId),
          Math.round(dataPoint.value * 10 ** 8)
        )
      ).not.to.be.reverted;
    }
  });
});
