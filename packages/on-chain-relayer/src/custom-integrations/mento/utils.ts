import { BigNumber } from "ethers";
import { DataPackagesResponse } from "redstone-sdk";

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

export const calculateLinkedListPosition = (
  rates: [string[], BigNumber[], number[]],
  valueToInsert: BigNumber,
  oracleAddress: string
) => {
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

// TODO: implement
export const prepareArgsForMentoAdapterReport = async (
  dataPackages: DataPackagesResponse
) => {};
