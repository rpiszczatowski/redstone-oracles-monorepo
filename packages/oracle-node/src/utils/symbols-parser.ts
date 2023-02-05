export const parseSymbolWithTradeDetails = (symbol: string) => {
  const regex = /(.*)_(.*)_(\d*)K$/;
  const parseResult = regex.exec(symbol);
  if (!parseResult) {
    throw new Error(`Invalid symbol with trade details: ${symbol}`);
  }

  const asset = parseResult[1];
  const action = parseResult[2] as "BUY" | "SELL";
  const amount = Number(parseResult[3]) * 1000;

  if (["BUY", "SELL"].includes(action)) {
    throw new Error(`Invalid action in symbol: ${symbol}`);
  }

  return {
    asset,
    action,
    amount,

    // TODO: improve this logic
    buyToken: asset, // TODO: use address
    sellToken: "DAI",
  };
};
