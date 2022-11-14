import { BigNumber, ethers } from "ethers";
import redstone from "redstone-api";

export const fetchTokenPrice = async (id: string) => {
  switch (id) {
    case "YYAV3SA1":
      return fetchPriceFromRedStone("AVAX");
    case "SAV2":
      return fetchPriceFromRedStone("sAVAX");
    case "YY_TJ_WAVAX_USDC_LP":
    case "MOO_TJ_WAVAX_USDC_LP":
      return fetchPriceFromRedStone("TJ_WAVAX_USDC_LP");
    default:
      throw new Error(`Invalid id ${id} for Avalanche EVM fetcher`);
  }
};

export const fetchPriceFromRedStone = async (token: string) => {
  const priceObjectFromApi = await redstone.getPrice(token);
  const priceAsString = priceObjectFromApi.value.toString();
  return ethers.utils.parseUnits(priceAsString, 18);
};

export const fetchTokensPrices = async (tokens: string[]) => {
  const priceObjectFromApi = await redstone.getPrice(tokens);
  const priceObject = {} as { [tokenName: string]: BigNumber };
  for (const token of tokens) {
    const priceAsString = priceObjectFromApi[token].value.toString();
    priceObject[token] = ethers.utils.parseUnits(priceAsString, 18);
  }
  return priceObject;
};
