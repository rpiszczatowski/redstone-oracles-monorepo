import {
  MulticallParsedResponses,
  MulticallParsedResponse,
} from "../../../../types";

export const extractValuesWithTheSameNameFromMulticall = (
  multicallResult: MulticallParsedResponses,
  address: string,
  id: string
): MulticallParsedResponse[] => {
  const results = multicallResult[address];
  if (!results) {
    throw new Error(`Multicall results for [${address}] is empty`);
  }
  const responseObjects = results.map((result) => result[id]);
  if (responseObjects.some((responseObject) => !responseObject?.value)) {
    throw new Error(
      `Multicall results doesn't contain some value for [${address}][${id}]`
    );
  }
  return responseObjects as MulticallParsedResponse[];
};
