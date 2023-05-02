import { BigNumber, ethers } from "ethers";
import { MulticallParsedResponses } from "../../../types";

export const extractPriceForGlpToken = (
  multicallResult: MulticallParsedResponses,
  address: string
) => {
  const value = multicallResult[address][0].getPrice;
  if (!value) {
    throw new Error(
      `Multicall result doesn't contain value for [${address}].getPrice`
    );
  }

  const price = BigNumber.from(value);
  return ethers.utils.formatUnits(price, 30);
};

export const extractValuesFromMulticallResponse = (
  multicallResult: MulticallParsedResponses,
  address: string,
  id: string
): string => {
  const results = multicallResult[address];
  const value = results.find((result) => !!result[id])?.[id];
  if (!value) {
    throw new Error(
      `Multicall result doesn't contain value for [${address}][${id}]`
    );
  }
  return value;
};

export const extractValuesWithTheSameNameFromMulticall = (
  multicallResult: MulticallParsedResponses,
  address: string,
  id: string
): Array<string | undefined> => {
  const results = multicallResult[address];
  const values = results.map((result) => result[id]);
  if (values.some((value) => !value)) {
    throw new Error(
      `Multicall results doesn't contain some value for [${address}][${id}]`
    );
  }
  return values;
};
