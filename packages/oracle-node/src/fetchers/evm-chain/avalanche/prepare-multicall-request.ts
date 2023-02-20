import { JsonFragment } from "@ethersproject/abi";
import { Fragment } from "ethers/lib/utils";
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
import {
  buildMulticallRequests,
  FunctionNamesWithValues,
} from "../shared/build-multicall-request";
import { lpTokensContractsDetails } from "./contracts-details/lp-tokens";
import { mooTokensContractsDetails } from "./contracts-details/moo-joe";
import { yieldYakContractsDetails } from "./contracts-details/yield-yak";
import { oracleAdaptersContractsDetails } from "./contracts-details/oracle-adapters";
import { glpManagerAddress } from "./contracts-details/glp-manager";
import {
  glpToken,
  GlpManagerDetailsKeys,
  glpManagerContractsDetails,
} from "../shared/contracts-details/glp-manager";

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
    ({ abi } = glpManagerContractsDetails[id as GlpManagerDetailsKeys]);
    functionsNamesWithValues = [{ name: "getPrice", values: [false] }];
    address = glpManagerAddress;
  } else {
    throw new Error(`Asset ${id} not supported by Avalanche multicall builder`);
  }

  return buildMulticallRequests(abi, address, functionsNamesWithValues);
};
