export const getKaikoMockResponse = ({
  symbol,
  value,
}: {
  symbol: string;
  value: number;
}) => {
  const isProperToken = ["BTC", "ETH", "AAVE"].includes(symbol);
  if (!isProperToken) {
    return {
      result: "error",
    };
  }
  return {
    query: {
      base_asset: symbol,
    },
    data: [
      {
        price: value,
        timestamp: 1672315260000,
      },
    ],
  };
};
