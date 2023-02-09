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
  glpToken,
  GlpManagerDetailsKeys,
} from "./AvalancheEvmFetcher";
import { fetchTokenPrice, fetchTokensPrices } from "./fetch-token-price";
import { lpTokensContractsDetails } from "./contracts-details/lp-tokens";
import { yieldYakContractsDetails } from "./contracts-details/yield-yak";
import { mooTokensContractsDetails } from "./contracts-details/moo-joe";
import { oracleAdaptersContractsDetails } from "./contracts-details/oracle-adapters";
import { glpManagerContractsDetails } from "./contracts-details/glp-manager";
import { sqrt } from "../../../utils/math";

// Fair LP Token Pricing has been implemented with the help of: https://blog.alphaventuredao.io/fair-lp-token-pricing/

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
  } else if (glpToken.includes(id)) {
    return extractPriceForGlpToken(response, id);
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
  if (tokenPrice) {
    const yieldYakPrice = tokenValue
      .mul(tokenPrice)
      .div(ethers.utils.parseUnits("1.0", 8));

    return ethers.utils.formatEther(yieldYakPrice);
  }
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

  const tokenPrices = await calculateTokensPrices(tokenReserves);
  const reservesSerialized = serializeDecimals(tokenReserves);

  if (tokenPrices) {
    const firstTokenPrice = tokenPrices[firstToken];
    const secondTokenPrice = tokenPrices[secondToken];

    const firstReserve = reservesSerialized[firstToken];
    const secondReserve = reservesSerialized[secondToken];

    const reservesMultiplied = firstReserve.mul(secondReserve);
    const pricesMultiplied = firstTokenPrice.mul(secondTokenPrice);

    const reservesMultipliedSqrt = sqrt(reservesMultiplied);
    const pricesMultipliedSqrt = sqrt(pricesMultiplied);

    const reservesPricesMulitplied =
      reservesMultipliedSqrt.mul(pricesMultipliedSqrt);

    const totalSupply = BigNumber.from(
      multicallResult[address].totalSupply.value
    );

    const lpTokenPrice = reservesPricesMulitplied.div(totalSupply).mul(2);

    return ethers.utils.formatEther(lpTokenPrice);
  }
};

const calculateTokensPrices = async (tokenReserves: TokenReserve) => {
  const tokenNames = Object.keys(tokenReserves);
  const tokensPrices = await fetchTokensPrices(tokenNames);
  const areAllTokensFetched =
    Object.keys(tokensPrices).length === Object.keys(tokenReserves).length;
  if (areAllTokensFetched) {
    return tokensPrices;
  }
};
const serializeDecimals = (tokenReserves: TokenReserve) => {
  const serializedTokenReserves = {} as TokenReserve;
  for (const tokenName of Object.keys(tokenReserves)) {
    let tokenReserveSerialized = tokenReserves[tokenName];
    if (["USDC", "USDT"].includes(tokenName)) {
      tokenReserveSerialized = tokenReserves[tokenName].mul(
        ethers.utils.parseUnits("1.0", 12)
      );
    } else if (tokenName === "BTC") {
      tokenReserveSerialized = tokenReserves[tokenName].mul(
        ethers.utils.parseUnits("1.0", 10)
      );
    }
    serializedTokenReserves[tokenName] = tokenReserveSerialized;
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

const extractPriceForGlpToken = (
  multicallResult: MulticallParsedResponses,
  id: string
) => {
  const { address } = glpManagerContractsDetails[id as GlpManagerDetailsKeys];
  const price = BigNumber.from(multicallResult[address].getPrice.value);
  return ethers.utils.formatUnits(price, 30);
};
