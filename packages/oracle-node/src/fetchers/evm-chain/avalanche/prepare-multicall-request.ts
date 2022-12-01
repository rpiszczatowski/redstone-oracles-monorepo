import { JsonFragment } from "@ethersproject/abi";
import { Fragment, Interface } from "ethers/lib/utils";
import {
  YieldYakDetailsKeys,
  LpTokensDetailsKeys,
  MooJoeTokensDetailsKeys,
  lpTokensIds,
  mooTokens,
  yyTokenIds,
  oracleAdaptersTokens,
  OracleAdaptersDetailsKeys,
} from "./AvalancheEvmFetcher";
import { lpTokensContractsDetails } from "./contracts-details/lp-tokens";
import { mooTokensContractsDetails } from "./contracts-details/moo-joe";
import { yieldYakContractsDetails } from "./contracts-details/yield-yak";
import { oracleAdaptersContractsDetails } from "./contracts-details/oracle-adapters";

export const prepareMulticallRequests = (id: string) => {
  let abi: string | readonly (string | Fragment | JsonFragment)[];
  let address: string;
  let functionsNames: string[] = [];

  if (yyTokenIds.includes(id)) {
    ({ abi, address } = yieldYakContractsDetails[id as YieldYakDetailsKeys]);
    functionsNames.push(...["totalDeposits", "totalSupply"]);
  } else if (lpTokensIds.includes(id)) {
    ({ abi, address } = lpTokensContractsDetails[id as LpTokensDetailsKeys]);
    functionsNames.push(...["getReserves", "totalSupply"]);
  } else if (mooTokens.includes(id)) {
    ({ abi, address } =
      mooTokensContractsDetails[id as MooJoeTokensDetailsKeys]);
    functionsNames.push(...["balance", "totalSupply"]);
  } else if (oracleAdaptersTokens.includes(id)) {
    ({ abi, address } =
      oracleAdaptersContractsDetails[id as OracleAdaptersDetailsKeys]);
    functionsNames.push("latestAnswer");
  } else {
    throw new Error(`Asset ${id} not supported by Avalanche multicall builder`);
  }

  return buildMulticallRequests(abi, address, functionsNames);
};

const buildMulticallRequests = (
  abi: string | readonly (string | Fragment | JsonFragment)[],
  address: string,
  functionsNames: string[]
) => {
  return functionsNames.map((functionName) => {
    const functionData = new Interface(abi).encodeFunctionData(functionName);
    return {
      address,
      data: functionData,
      name: functionName,
    };
  });
};
