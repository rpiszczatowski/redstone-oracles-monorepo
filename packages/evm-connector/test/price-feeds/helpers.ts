import { Contract } from "ethers";
import { WrapperBuilder } from "../../src";

export const getWrappedContract = (contract: Contract, timestamp: number) => {
  return WrapperBuilder.wrap(contract).usingSimpleNumericMock({
    mockSignersCount: 10,
    dataPoints: [
      { dataFeedId: "BTC", value: 23077.68 },
      { dataFeedId: "ETH", value: 1670.99 },
      { dataFeedId: "AVAX", value: 20.05 },
      { dataFeedId: "USDT", value: 1 },
      { dataFeedId: "USDC", value: 1 },
      { dataFeedId: "BUSD", value: 1 },
      { dataFeedId: "LINK", value: 7 },
      { dataFeedId: "GMX", value: 67 },
      { dataFeedId: "PNG", value: 0.06 },
      { dataFeedId: "QI", value: 0.01 },
      { dataFeedId: "JOE", value: 0.2 },
      { dataFeedId: "YAK", value: 318 },
      { dataFeedId: "PTP", value: 0.15 },
    ],
    timestampMilliseconds: timestamp,
  });
};
