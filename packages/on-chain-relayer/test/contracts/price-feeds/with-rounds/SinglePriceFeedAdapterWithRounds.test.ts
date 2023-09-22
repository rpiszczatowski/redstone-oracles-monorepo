import { describeCommonPriceFeedsAdapterTests } from "../common/price-feeds-adapter-utils";

describe("SinglePriceFeedAdapterWithRounds", () => {
  describeCommonPriceFeedsAdapterTests({
    adapterContractName: "SinglePriceFeedAdapterWithRoundsMock",
    hasOnlyOneDataFeed: true,
    skipTestsForPrevDataTimestamp: false,
  });
});
