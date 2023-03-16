export const getDeribitMockResponse = ({
  symbol,
  value,
}: {
  symbol: string;
  value: number;
}) => {
  const isProperToken = ["BTCDVOL", "ETHDVOL"].includes(symbol);
  if (!isProperToken) {
    return {
      error: "Invalid params",
    };
  }
  return {
    jsonrpc: "2.0",
    result: {
      estimated_delivery_price: value,
      index_price: value,
    },
  };
};
