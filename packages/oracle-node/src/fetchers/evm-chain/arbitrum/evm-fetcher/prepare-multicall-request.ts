import { JsonFragment } from "@ethersproject/abi";
import { Fragment } from "ethers/lib/utils";
import {
  FunctionNamesWithValues,
  buildMulticallRequests,
} from "../../shared/build-multicall-request";
import {
  glpManagerContractsDetails,
  GlpManagerDetailsKeys,
  glpToken,
} from "../../shared/contracts-details/glp-manager";
import { glpManagerAddress } from "./contracts-details/glp-manger-address";

export const prepareMulticallRequests = (id: string) => {
  let abi: string | readonly (string | Fragment | JsonFragment)[];
  let address: string;
  let functionsNamesWithValues: FunctionNamesWithValues[] = [];

  if (glpToken.includes(id)) {
    ({ abi } = glpManagerContractsDetails[id as GlpManagerDetailsKeys]);
    functionsNamesWithValues = [{ name: "getPrice", values: [false] }];
    address = glpManagerAddress;
  } else {
    throw new Error(`Asset ${id} not supported by Avalanche multicall builder`);
  }

  return buildMulticallRequests(abi, address, functionsNamesWithValues);
};
