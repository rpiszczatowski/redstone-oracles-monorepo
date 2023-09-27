import { MulticallParsedResponses } from "../../../../types";

export const extractValueFromMulticallResponse = (
  multicallResult: MulticallParsedResponses,
  address: string,
  id: string
): string => {
  const results = multicallResult[address];
  const responseObject = results!.find((result) => !!result[id])?.[id];
  if (!responseObject) {
    throw new Error(
      `Multicall result doesn't contain value for [${address}][${id}]`
    );
  }
  return responseObject.value;
};
