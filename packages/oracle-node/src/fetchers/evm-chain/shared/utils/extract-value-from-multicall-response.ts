import { MulticallParsedResponses } from "../../../../types";

export const extractValueFromMulticallResponse = (
  multicallResult: MulticallParsedResponses,
  address: string,
  id: string
): string => {
  const results = multicallResult[address];
  const value = results!.find((result) => !!result[id])?.[id];
  if (!value) {
    throw new Error(
      `Multicall result doesn't contain value for [${address}][${id}]`
    );
  }
  return value;
};
