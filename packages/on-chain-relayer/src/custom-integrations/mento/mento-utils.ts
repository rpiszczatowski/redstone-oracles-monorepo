import { BigNumber } from "ethers";
import { DataPackagesResponse } from "redstone-sdk";
import { ISortedOracles, MentoAdapter } from "../../../typechain-types";

export interface MentoContracts {
  mentoAdapter: MentoAdapter;
  wrappedMentoAdapter: MentoAdapter;
  sortedOracles: ISortedOracles;
}

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

export const prepareLinkedListLocationsForMentoAdapterReport = async ({
  mentoAdapter,
  wrappedMentoAdapter,
  sortedOracles,
}: MentoContracts) => {
  const dataFeeds = await mentoAdapter.getDataFeeds();
  const dataFeedIds = dataFeeds.map((df) => df.dataFeedId);
  const locationsInSortedLinkedLists = [];
  const proposedValuesNormalized =
    await wrappedMentoAdapter.getNormalizedOracleValuesFromTxCalldata(
      dataFeedIds
    );

  // Filling the `locationsInSortedLinkedLists` array
  // TODO: make it using Promise.all
  for (
    let dataFeedIndex = 0;
    dataFeedIndex < dataFeeds.length;
    dataFeedIndex++
  ) {
    const tokenAddress = dataFeeds[dataFeedIndex].tokenAddress;
    const rates = await sortedOracles.getRates(tokenAddress);
    const locationInSortedLinkedList = calculateLinkedListPosition(
      rates,
      proposedValuesNormalized[dataFeedIndex],
      mentoAdapter.address
    );
    locationsInSortedLinkedLists.push(locationInSortedLinkedList);
  }

  return locationsInSortedLinkedLists;
};
