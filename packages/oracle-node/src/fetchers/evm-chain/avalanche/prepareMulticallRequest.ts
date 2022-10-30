import { JsonFragment } from "@ethersproject/abi";
import { Fragment, Interface } from "ethers/lib/utils";
import {
  YieldYakDetailsKeys,
  LpTokensDetailsKeys,
  MooJoeTokensDetailsKeys,
  lpTokensIds,
  mooTokens,
  yyTokenIds,
} from "./AvalancheEvmFetcher";
import { lpTokensContractsDetails } from "./contracts-details/lp-tokens";
import { mooTokensContractsDetails } from "./contracts-details/moo-joe";
import { yieldYakContractsDetails } from "./contracts-details/yield-yak";

export const prepareMulticallRequests = (id: string) => {
  let abi: string | readonly (string | Fragment | JsonFragment)[];
  let address: string;
  let firstFunctionName: string;

  if (yyTokenIds.includes(id)) {
    ({ abi, address } = yieldYakContractsDetails[id as YieldYakDetailsKeys]);
    firstFunctionName = "totalDeposits";
  } else if (lpTokensIds.includes(id)) {
    ({ abi, address } = lpTokensContractsDetails[id as LpTokensDetailsKeys]);
    firstFunctionName = "getReserves";
  } else if (mooTokens.includes(id)) {
    ({ abi, address } =
      mooTokensContractsDetails[id as MooJoeTokensDetailsKeys]);
    firstFunctionName = "balance";
  } else {
    throw new Error("Asset ID not supported by Avalanche multicall builder");
  }

  return buildMulticallRequests(abi, address, firstFunctionName);
};

const buildMulticallRequests = (
  abi: string | readonly (string | Fragment | JsonFragment)[],
  address: string,
  firstFunctionName: string,
  secondFunctionName: string = "totalSupply"
) => {
  const firstFunctionData = new Interface(abi).encodeFunctionData(
    firstFunctionName
  );
  const secondFunctionData = new Interface(abi).encodeFunctionData(
    secondFunctionName
  );
  const requests = [
    {
      address,
      data: firstFunctionData,
      name: firstFunctionName,
    },
    {
      address,
      data: secondFunctionData,
      name: secondFunctionName,
    },
  ];
  return requests;
};
