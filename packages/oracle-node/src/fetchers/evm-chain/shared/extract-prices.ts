import { BigNumber, ethers } from "ethers";
import { MulticallParsedResponses } from "../../../types";

export const extractPriceForGlpToken = (
  multicallResult: MulticallParsedResponses,
  address: string
) => {
  const value = multicallResult[address].getPrice;
  if (!value) {
    throw new Error(
      `Multicall result doesn't contain value for [${address}].getPrice`
    );
  }

  const price = BigNumber.from(value);
  return ethers.utils.formatUnits(price, 30);
};

export const extractValueFromMulticallResponse = (
  multicallResult: MulticallParsedResponses,
  address: string,
  id: string
): string => {
  const value = multicallResult[address][id];
  if (!value) {
    throw new Error(
      `Multicall result doesn't contain value for [${address}][${id}]`
    );
  }
  return value;
};
