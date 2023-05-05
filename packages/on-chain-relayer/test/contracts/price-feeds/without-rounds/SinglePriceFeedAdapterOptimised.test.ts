import { describeCommonPriceFeedsAdapterTests } from "../common/price-feeds-adapter-utils";

describe("SinglePriceFeedAdapterOptimised", () => {
  describeCommonPriceFeedsAdapterTests({
    adapterContractName: "SinglePriceFeedAdapterOptimisedMock",
    hasOnlyOneDataFeed: true,
    skipTestsForPrevDataTimestamp: false,
  });
});
