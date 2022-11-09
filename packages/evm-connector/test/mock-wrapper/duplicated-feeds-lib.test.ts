import { expect } from "chai";
import { ethers } from "hardhat";
import { utils } from "redstone-protocol";
import { WrapperBuilder } from "../../src/index";
import { SampleDuplicatedDataFeeds } from "../../typechain-types";
import { expectedNumericValues, mockNumericPackages } from "../tests-common";

describe("DuplicatedDataFeeds", function () {
  let contract: SampleDuplicatedDataFeeds;

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleDuplicatedDataFeeds"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should pass", async () => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockNumericPackages);

    const symbolsWithDuplicates = [
      "ETH",
      "BTC",
      "ETH",
      "ETH",
      "BTC",
      "ETH",
      "BTC",
    ];

    const tx = await wrappedContract.saveOracleValuesInStorage(
      symbolsWithDuplicates.map(utils.convertStringToBytes32)
    );
    await tx.wait();

    const values = await contract.getValuesFromStorage();
    for (
      let symbolIndex = 0;
      symbolIndex < symbolsWithDuplicates.length;
      symbolIndex++
    ) {
      const symbol = symbolsWithDuplicates[symbolIndex];
      expect(values[symbolIndex].toNumber()).to.eql(
        expectedNumericValues[symbol]
      );
    }
  });
});
