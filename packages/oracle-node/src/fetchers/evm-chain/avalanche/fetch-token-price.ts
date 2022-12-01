import { BigNumber, ethers } from "ethers";
import redstone from "redstone-api";
import {
  MooJoeTokensDetailsKeys,
  YieldYakDetailsKeys,
} from "./AvalancheEvmFetcher";
import { mooTokensContractsDetails } from "./contracts-details/moo-joe";
import { yieldYakContractsDetails } from "./contracts-details/yield-yak";

type TokenContractKeys = YieldYakDetailsKeys | MooJoeTokensDetailsKeys;

export const fetchTokenPrice = async (id: string) => {
  const contractDetails = {
    ...yieldYakContractsDetails,
    ...mooTokensContractsDetails,
  };
  const tokenContractDetails = contractDetails[id as TokenContractKeys];
  if (!tokenContractDetails) {
    throw new Error(`Invalid id ${id} for Avalanche EVM fetcher`);
  }
  const priceObjectFromApi = await redstone.getPrice(
    tokenContractDetails.tokenToFetch
  );
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
