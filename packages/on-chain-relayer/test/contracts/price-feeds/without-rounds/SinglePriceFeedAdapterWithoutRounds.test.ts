import { describeCommonPriceFeedsAdapterTests } from "../common/price-feeds-adapter-utils";

describe("SinglePriceFeedAdapterWithoutRounds", () => {
  describeCommonPriceFeedsAdapterTests({
    adapterContractName: "SinglePriceFeedAdapterWithoutRoundsMock",
    hasOnlyOneDataFeed: true,
    skipTestsForPrevDataTimestamp: false,
  });
});
