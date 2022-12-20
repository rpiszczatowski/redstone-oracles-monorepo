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
  glpToken,
  GlpManagerDetailsKeys,
} from "./AvalancheEvmFetcher";
import { lpTokensContractsDetails } from "./contracts-details/lp-tokens";
import { mooTokensContractsDetails } from "./contracts-details/moo-joe";
import { yieldYakContractsDetails } from "./contracts-details/yield-yak";
import { oracleAdaptersContractsDetails } from "./contracts-details/oracle-adapters";
import { glpManagerContractsDetails } from "./contracts-details/glp-manager";

interface FunctionNamesWithValues {
  name: string;
  values?: any[];
}

export const prepareMulticallRequests = (id: string) => {
  let abi: string | readonly (string | Fragment | JsonFragment)[];
  let address: string;
  let functionsNamesWithValues: FunctionNamesWithValues[] = [];

  if (yyTokenIds.includes(id)) {
    ({ abi, address } = yieldYakContractsDetails[id as YieldYakDetailsKeys]);
    functionsNamesWithValues = [
      { name: "totalDeposits" },
      { name: "totalSupply" },
    ];
  } else if (lpTokensIds.includes(id)) {
    ({ abi, address } = lpTokensContractsDetails[id as LpTokensDetailsKeys]);
    functionsNamesWithValues = [
      { name: "getReserves" },
      { name: "totalSupply" },
    ];
  } else if (mooTokens.includes(id)) {
    ({ abi, address } =
      mooTokensContractsDetails[id as MooJoeTokensDetailsKeys]);
    functionsNamesWithValues = [{ name: "balance" }, { name: "totalSupply" }];
  } else if (oracleAdaptersTokens.includes(id)) {
    ({ abi, address } =
      oracleAdaptersContractsDetails[id as OracleAdaptersDetailsKeys]);
    functionsNamesWithValues = [{ name: "latestAnswer" }];
  } else if (glpToken.includes(id)) {
    ({ abi, address } =
      glpManagerContractsDetails[id as GlpManagerDetailsKeys]);
    functionsNamesWithValues = [{ name: "getPrice", values: [false] }];
  } else {
    throw new Error(`Asset ${id} not supported by Avalanche multicall builder`);
  }

  return buildMulticallRequests(abi, address, functionsNamesWithValues);
};

const buildMulticallRequests = (
  abi: string | readonly (string | Fragment | JsonFragment)[],
  address: string,
  functionsNamesWithValues: FunctionNamesWithValues[]
) => {
  return Object.values(functionsNamesWithValues).map(({ name, values }) => {
    const functionData = new Interface(abi).encodeFunctionData(name, values);
    return {
      address,
      data: functionData,
      name,
    };
  });
};
