import { JsonFragment } from "@ethersproject/abi";
import { Fragment, Interface } from "ethers/lib/utils";

export interface FunctionNamesWithValues {
  name: string;
  values?: unknown[];
}

export interface MulticallRequest {
  address: string;
  data: string;
  name: string;
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
