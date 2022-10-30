import redstone from "redstone-api";
import { BigNumber, ethers } from "ethers";
import { MulticallParsedResponses } from "../../../types";
import {
  YieldYakDetailsKeys,
  LpTokensDetailsKeys,
  lpTokensIds,
  mooTokens,
  yyTokenIds,
  MooJoeTokensDetailsKeys,
} from "./AvalancheEvmFetcher";
import { lpTokensContractsDetails } from "./contracts-details/lp-tokens";
import { yieldYakContractsDetails } from "./contracts-details/yield-yak";
import { mooTokensContractsDetails } from "./contracts-details/moo-joe";

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
  const { address } = lpTokensContractsDetails[id as LpTokensDetailsKeys];

  const reserves = multicallResult[address].getReserves.value;
  const wavaxReserve = BigNumber.from(reserves.slice(0, 66));
  const wavaxPrice = await fetchPriceFromRedStone("WAVAX");
  const wavaxReservePrice = wavaxReserve.mul(wavaxPrice);

  const usdcReserveInHex = `0x${reserves.slice(66, 130)}`;
  const usdcReserveWith18Decimals = BigNumber.from(usdcReserveInHex).mul(
    ethers.utils.parseUnits("1.0", 12)
  );
  const usdcPrice = await fetchPriceFromRedStone("USDC");
  const usdcReservePrice = usdcReserveWith18Decimals.mul(usdcPrice);

  const reservesPricesSum = wavaxReservePrice.add(usdcReservePrice);
  const totalSupply = BigNumber.from(
    multicallResult[address].totalSupply.value
  );
  const lpTokenPrice = reservesPricesSum.div(totalSupply);
  return ethers.utils.formatEther(lpTokenPrice);
};

const fetchTokenPrice = async (id: string) => {
  switch (id) {
    case "YYAV3SA1":
      return fetchPriceFromRedStone("AVAX");
    case "SAV2":
      return fetchPriceFromRedStone("sAVAX");
    case "YY_TJ_AVAX_USDC_LP":
    case "MOO_TJ_AVAX_USDC_LP":
      return fetchPriceFromRedStone("TJ_AVAX_USDC_LP");
    default:
      throw new Error("Invalid id for Avalanche EVM fetcher");
  }
};

const fetchPriceFromRedStone = async (token: string) => {
  const priceObjectFromApi = await redstone.getPrice(token);
  const priceAsString = priceObjectFromApi.value.toString();
  return ethers.utils.parseUnits(priceAsString, 18);
};
