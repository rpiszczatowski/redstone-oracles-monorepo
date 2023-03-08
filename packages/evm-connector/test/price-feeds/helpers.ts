import { Contract } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { formatBytes32String } from "ethers/lib/utils";
import { WrapperBuilder } from "../../src";

export const ethDataFeed = formatBytes32String("ETH");
export const btcDataFeed = formatBytes32String("BTC");

interface DataPoint {
  dataFeedId: string;
  value: number;
}

export const dataFeedsIds = [ethDataFeed, btcDataFeed];

export const getWrappedContract = async (
  contract: Contract,
  timestamp: number,
  newDataPoint?: DataPoint
) => {
  const dataPoints = [
    { dataFeedId: "BTC", value: 23077.68 },
    { dataFeedId: "ETH", value: 1670.99 },
  ];
  if (newDataPoint) {
    dataPoints.push(newDataPoint);
  }
  const blockTimestamp = await time.latest();
  await time.setNextBlockTimestamp(blockTimestamp + 10);
  return WrapperBuilder.wrap(contract).usingSimpleNumericMock({
    mockSignersCount: 10,
    dataPoints,
    timestampMilliseconds: timestamp,
  });
};

export const addDataFeedsToRegistry = async (registryContract: Contract) => {
  const firstDataFeedIdToAdd = formatBytes32String("ETH");
  const secondDataFeedIdToAdd = formatBytes32String("BTC");
  await registryContract.addDataFeed(firstDataFeedIdToAdd);
  await registryContract.addDataFeed(secondDataFeedIdToAdd);
};
