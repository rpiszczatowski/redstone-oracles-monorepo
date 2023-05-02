import { BigNumber, ethers } from "ethers";
import { getLastPrice } from "../../../../db/local-db";
import {
  GmdTokensDetailsKeys,
  MooJoeTokensDetailsKeys,
  YieldYakDetailsKeys,
} from "./AvalancheEvmFetcher";
import { mooTokensContractsDetails } from "./contracts-details/moo-joe";
import { yieldYakContractsDetails } from "./contracts-details/yield-yak";
import { gmdTokensDetails } from "./contracts-details/gmd";

type TokenContractKeys =
  | YieldYakDetailsKeys
  | MooJoeTokensDetailsKeys
  | GmdTokensDetailsKeys;

export const fetchTokenPrice = (id: string) => {
  const contractDetails = {
    ...yieldYakContractsDetails,
    ...mooTokensContractsDetails,
    ...gmdTokensDetails,
  };
  const tokenContractDetails = contractDetails[id as TokenContractKeys];
  if (!tokenContractDetails) {
    throw new Error(`Invalid id ${id} for Avalanche EVM fetcher`);
  }
  const tokenPriceFromDb = getLastPrice(tokenContractDetails.tokenToFetch);
  if (tokenPriceFromDb) {
    const priceAsString = tokenPriceFromDb.value.toString();
    return ethers.utils.parseUnits(priceAsString, 18);
  }
};

export const fetchTokensPrices = (tokens: string[]) => {
  const priceObject = {} as { [tokenName: string]: BigNumber };
  for (const token of tokens) {
    const tokenPriceFromDb = getLastPrice(token);
    if (tokenPriceFromDb) {
      const priceAsString = tokenPriceFromDb.value.toString();
      priceObject[token] = ethers.utils.parseUnits(priceAsString, 18);
    }
  }
  return priceObject;
};
