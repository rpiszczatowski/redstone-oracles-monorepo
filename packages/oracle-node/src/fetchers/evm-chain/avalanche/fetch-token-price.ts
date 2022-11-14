import { BigNumber, ethers } from "ethers";
import redstone from "redstone-api";

const tokensNameToSlice = [
  "YY_TJ_WAVAX_USDC_LP",
  "MOO_TJ_WAVAX_USDC_LP",
  "YY_PNG_WAVAX_USDC_LP",
  "YY_PNG_WETH_WAVAX_LP",
  "YY_TJ_sAVAX_WAVAX_LP",
  "YY_TJ_WETH_WAVAX_LP",
];

export const fetchTokenPrice = async (id: string) => {
  if (id === "YYAV3SA1") {
    return fetchPriceFromRedStone("AVAX");
  } else if (id === "SAV2") {
    return fetchPriceFromRedStone("sAVAX");
  } else if (tokensNameToSlice.includes(id)) {
    const tokenIdToFetch = id.split("_").slice(1).join("_");
    return fetchPriceFromRedStone(tokenIdToFetch);
  }
  throw new Error(`Invalid id ${id} for Avalanche EVM fetcher`);
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
