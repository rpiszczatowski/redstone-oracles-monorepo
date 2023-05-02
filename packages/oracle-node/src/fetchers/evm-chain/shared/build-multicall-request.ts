import { JsonFragment } from "@ethersproject/abi";
import { Fragment, Interface } from "ethers/lib/utils";
import { MulticallRequest } from "../../../types";

export interface FunctionNamesWithValues {
  name: string;
  values?: any[];
}

export const buildMulticallRequests = (
  abi: string | readonly (string | Fragment | JsonFragment)[],
  address: string,
  functionsNamesWithValues: FunctionNamesWithValues[]
): MulticallRequest[] => {
  return Object.values(functionsNamesWithValues).map(({ name, values }) => {
    const functionData = new Interface(abi).encodeFunctionData(name, values);
    return {
      address,
      data: functionData,
      name,
    };
  });
};
