export const buildLiquidityDataFeedId = (
  tokenName: string,
  sourceName: string
) => `${tokenName}_${sourceName}_liquidity`;

export const getDataFromLiquidityDataFeedId = (liquidityDataFeedId: string) => {
  const splitted = liquidityDataFeedId.split("_");
  return {
    dataFeedId: splitted[0],
    source: splitted[1],
  };
};
