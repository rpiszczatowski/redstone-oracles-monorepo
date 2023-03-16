import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { MockSortedOracles } from "../../../../typechain-types";
import { BigNumber } from "ethers";

describe("MockSortedOracles", () => {
  let contract: MockSortedOracles;
  let signers: SignerWithAddress[];
  const mockTokenAddress = "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9"; // CELO token address

  const addressesAreEqual = (addr1: string, addr2: string) => {
    return addr1.toLowerCase() === addr2.toLowerCase();
  };

  const safelyGetAddressOrZero = (
    oracleAddresses: string[],
    uncheckedIndex: number
  ) => {
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    return uncheckedIndex < 0 || uncheckedIndex > oracleAddresses.length - 1
      ? zeroAddress
      : oracleAddresses[uncheckedIndex];
  };

  const calculateLinkedListPosition = async (
    valueToInsert: BigNumber,
    oracleAddress: string
  ) => {
    const rates = await contract.getRates(mockTokenAddress);
    // We need to copy the arrays for being able to filter out current oracle later
    const oracleAddresses = [...rates[0]];
    const oracleValues = [...rates[1]];

    // Removing current oracle values
    const indexOfCurrentOracle = oracleAddresses.findIndex((elem) =>
      addressesAreEqual(oracleAddress, elem)
    );
    if (indexOfCurrentOracle > -1) {
      const numberOfItemsToRemove = 1;
      oracleAddresses.splice(indexOfCurrentOracle, numberOfItemsToRemove);
      oracleValues.splice(indexOfCurrentOracle, numberOfItemsToRemove);
    }

    // We use a simple O(N) algorithm here, since it's easier to read
    // And we can safely assume that the number of oracles will not exceed 1000
    // Note! oracleValues are sorted in descending order
    // Greater key means key on the right (not the bigger one)
    let indexToInsert = oracleValues.length;
    for (let i = 0; i < oracleValues.length; i++) {
      const currentValue = oracleValues[i];
      if (currentValue.lt(valueToInsert)) {
        indexToInsert = i;
        break;
      }
    }

    return {
      lesserKey: safelyGetAddressOrZero(oracleAddresses, indexToInsert),
      greaterKey: safelyGetAddressOrZero(oracleAddresses, indexToInsert - 1),
    };
  };

  const reportNewOracleValue = async (
    valueToReport: number,
    signer: SignerWithAddress
  ) => {
    const { lesserKey, greaterKey } = await calculateLinkedListPosition(
      BigNumber.from(valueToReport),
      signer.address
    );

    const tx = await contract
      .connect(signer)
      .report(mockTokenAddress, valueToReport, lesserKey, greaterKey);
    await tx.wait();
  };

  const expectOracleValues = async (expectedValues: number[]) => {
    const [, oracleValues] = await contract.getRates(mockTokenAddress);
    expect(oracleValues).to.eql(expectedValues.map(BigNumber.from));
  };

  before(async () => {
    signers = await ethers.getSigners();
  });

  beforeEach(async () => {
    // Deploying AddressSortedLinkedListWithMedian library
    const AddressSortedLinkedListWithMedianFactory =
      await ethers.getContractFactory("AddressSortedLinkedListWithMedian");
    const sortedLinkedListContract =
      await AddressSortedLinkedListWithMedianFactory.deploy();
    await sortedLinkedListContract.deployed();

    // Deploying MockSortedOracles contract
    const MockSortedOraclesFactory = await ethers.getContractFactory(
      "MockSortedOracles",
      {
        libraries: {
          AddressSortedLinkedListWithMedian: sortedLinkedListContract.address,
        },
      }
    );
    contract = await MockSortedOraclesFactory.deploy();
    await contract.deployed();
  });

  it("Different oracles should properly report their values", async () => {
    await reportNewOracleValue(42, signers[0]);
    await expectOracleValues([42]);

    await reportNewOracleValue(44, signers[1]);
    await expectOracleValues([44, 42]);

    await reportNewOracleValue(43, signers[2]);
    await expectOracleValues([44, 43, 42]);

    await reportNewOracleValue(1, signers[3]);
    await expectOracleValues([44, 43, 42, 1]);

    await reportNewOracleValue(1000, signers[4]);
    await expectOracleValues([1000, 44, 43, 42, 1]);
  });

  it("The same oracle should properly update their value", async () => {
    await reportNewOracleValue(42, signers[0]);
    await expectOracleValues([42]);

    await reportNewOracleValue(45, signers[0]);
    await expectOracleValues([45]);

    await reportNewOracleValue(43, signers[0]);
    await expectOracleValues([43]);

    await reportNewOracleValue(1, signers[0]);
    await expectOracleValues([1]);

    await reportNewOracleValue(100, signers[0]);
    await expectOracleValues([100]);
  });

  it("2 iterations of oracle reports", async () => {
    // Iteration 1
    await reportNewOracleValue(42, signers[0]);
    await expectOracleValues([42]);

    await reportNewOracleValue(44, signers[1]);
    await expectOracleValues([44, 42]);

    await reportNewOracleValue(43, signers[2]);
    await expectOracleValues([44, 43, 42]);

    // Iteration 2
    await reportNewOracleValue(42, signers[0]);
    await expectOracleValues([44, 43, 42]);

    await reportNewOracleValue(100, signers[1]);
    await expectOracleValues([100, 43, 42]);

    await reportNewOracleValue(1000, signers[2]);
    await expectOracleValues([1000, 100, 42]);
  });
});
