import { formatUnits, parseEther, parseUnits } from "ethers/lib/utils";

// TODO: improve this file to easier support more other tokens in future

const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const OHM_ADDRESS = "0x64aa3364f17a4d01c6f1751fd97c2bd3d7e7f1d5";
const OHM_DECIMALS = 9;
const DAI_DECIMALS = 18;

export const parseSymbolWithTradeDetails = (symbol: string) => {
  const regex = /(.*)_(.*)_(\d*)K$/;
  const parseResult = regex.exec(symbol);
  if (!parseResult) {
    throw new Error(`Invalid symbol with trade details: ${symbol}`);
  }

  const asset = parseResult[1];
  const action = parseResult[2] as "BUY" | "SELL";
  const amount = Number(parseResult[3]) * 1000;

  if (!["BUY", "SELL"].includes(action)) {
    throw new Error(`Invalid action in symbol: ${symbol}`);
  }

  const assetAddress = getAddress(asset);
  const assetAmount = getAssetAmount(amount, assetAddress);

  return {
    asset,
    action,
    amount,

    reqParams: {
      buyToken: action === "BUY" ? assetAddress : DAI_ADDRESS,
      sellToken: action === "SELL" ? assetAddress : DAI_ADDRESS,
      ...(action === "BUY"
        ? { buyAmount: assetAmount }
        : { sellAmount: assetAmount }),
    },
  };
};

function getAddress(symbol: string) {
  return OHM_ADDRESS;
}

function getAssetAmount(amount: number, address: string): string {
  if (address == DAI_ADDRESS) {
    return parseUnits(String(amount), DAI_DECIMALS).toString();
  } else {
    return parseUnits(String(amount), OHM_DECIMALS).toString();
  }
}
