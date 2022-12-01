import { BigNumber, ethers } from "ethers";
import { MulticallParsedResponses } from "../../../types";
import {
  YieldYakDetailsKeys,
  LpTokensDetailsKeys,
  lpTokensIds,
  mooTokens,
  yyTokenIds,
  MooJoeTokensDetailsKeys,
  oracleAdaptersTokens,
  OracleAdaptersDetailsKeys,
} from "./AvalancheEvmFetcher";
import { fetchTokenPrice, fetchTokensPrices } from "./fetch-token-price";
import { lpTokensContractsDetails } from "./contracts-details/lp-tokens";
import { yieldYakContractsDetails } from "./contracts-details/yield-yak";
import { mooTokensContractsDetails } from "./contracts-details/moo-joe";
import { oracleAdaptersContractsDetails } from "./contracts-details/oracle-adapters";

interface TokenReserve {
  [name: string]: BigNumber;
}

export const extractPrice = async (
  response: MulticallParsedResponses,
  id: string
) => {
  if (yyTokenIds.includes(id)) {
    const { address } = yieldYakContractsDetails[id as YieldYakDetailsKeys];
    return extractPriceForYieldYakOrMoo(response, id, address, "totalDeposits");
  } else if (lpTokensIds.includes(id)) {
    return extractPriceForLpTokens(response, id);
  } else if (mooTokens.includes(id)) {
    const { address } =
      mooTokensContractsDetails[id as MooJoeTokensDetailsKeys];
    return extractPriceForYieldYakOrMoo(response, id, address, "balance");
  } else if (oracleAdaptersTokens.includes(id)) {
    return extractPriceForOracleAdapterTokens(response, id);
  }
};

const extractPriceForYieldYakOrMoo = async (
  multicallResult: MulticallParsedResponses,
  id: string,
  address: string,
  firstFunctionName: string,
  secondFunctionName: string = "totalSupply"
) => {
  const totalDeposits = BigNumber.from(
    multicallResult[address][firstFunctionName].value
  );
  const totalSupply = BigNumber.from(
    multicallResult[address][secondFunctionName].value
  );

  const tokenValue = totalDeposits
    .mul(ethers.utils.parseUnits("1.0", 8))
    .div(totalSupply);

  const tokenPrice = await fetchTokenPrice(id);
  const yieldYakPrice = tokenValue
    .mul(tokenPrice)
    .div(ethers.utils.parseUnits("1.0", 8));

  return ethers.utils.formatEther(yieldYakPrice);
};

const extractPriceForLpTokens = async (
  multicallResult: MulticallParsedResponses,
  id: string
) => {
  const { address, tokensToFetch } =
    lpTokensContractsDetails[id as LpTokensDetailsKeys];
  const reserves = multicallResult[address].getReserves.value;

  const firstTokenReserve = BigNumber.from(reserves.slice(0, 66));
  const firstToken = tokensToFetch[0];
  const secondTokenReserve = BigNumber.from(`0x${reserves.slice(66, 130)}`);
  const secondToken = tokensToFetch[1];
  const tokenReserves = {
    [firstToken]: firstTokenReserve,
    [secondToken]: secondTokenReserve,
  };
  const tokensReservesPrices = await calculateReserveTokensPrices(
    tokenReserves
  );
  const firstTokenReservePrice = tokensReservesPrices[firstToken];
  const secondTokenReservePrice = tokensReservesPrices[secondToken];
  const reservesPricesSum = firstTokenReservePrice.add(secondTokenReservePrice);
  const totalSupply = BigNumber.from(
    multicallResult[address].totalSupply.value
  );
  const lpTokenPrice = reservesPricesSum.div(totalSupply);
  return ethers.utils.formatEther(lpTokenPrice);
};

const calculateReserveTokensPrices = async (tokenReserves: TokenReserve) => {
  const tokenNames = Object.keys(tokenReserves);
  const tokensPrices = await fetchTokensPrices(tokenNames);
  const tokensReservesSerialized = serializeStableCoinsDecimals(tokenReserves);
  const tokensReservesPrices = {} as TokenReserve;
  for (const tokenName of Object.keys(tokenReserves)) {
    const tokenReservePrice = tokensReservesSerialized[tokenName].mul(
      tokensPrices[tokenName]
    );
    tokensReservesPrices[tokenName] = tokenReservePrice;
  }
  return tokensReservesPrices;
};

const serializeStableCoinsDecimals = (tokenReserves: TokenReserve) => {
  const serializedTokenReserves = {} as TokenReserve;
  for (const tokenName of Object.keys(tokenReserves)) {
    if (!["USDC", "USDT"].includes(tokenName)) {
      serializedTokenReserves[tokenName] = tokenReserves[tokenName];
    } else {
      const tokenReserveSerialized = tokenReserves[tokenName].mul(
        ethers.utils.parseUnits("1.0", 12)
      );
      serializedTokenReserves[tokenName] = tokenReserveSerialized;
    }
  }
  return serializedTokenReserves;
};

const extractPriceForOracleAdapterTokens = (
  multicallResult: MulticallParsedResponses,
  id: string
) => {
  const { address } =
    oracleAdaptersContractsDetails[id as OracleAdaptersDetailsKeys];
  const latestAnswer = BigNumber.from(
    multicallResult[address].latestAnswer.value
  );
  return ethers.utils.formatUnits(latestAnswer, 8);
};
