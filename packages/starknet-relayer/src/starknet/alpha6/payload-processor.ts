import { RedstonePayloadParser } from "redstone-protocol/dist/src/redstone-payload/RedstonePayloadParser";
import { arrayify, hexlify } from "ethers/lib/utils";
import { recoverSignerAddress } from "redstone-protocol";
import assert from "assert";

export function processPayload(
  payloadHex: string,
  dataFeedIds: string[],
  uniqueSignerCountThreshold: number,
  allowedSignerAddresses: string[]
): { priceValues: number[]; timestamp: number } {
  let parsedPayload = new RedstonePayloadParser(arrayify(payloadHex)).parse();

  let prices = Object.assign(
    {},
    ...dataFeedIds.map((feedId) => ({ [feedId]: [] }))
  );

  let timestamp = Number.MAX_SAFE_INTEGER;

  for (const signedDataPackage of parsedPayload.signedDataPackages) {
    const address = recoverSignerAddress(signedDataPackage);
    if (!allowedSignerAddresses.includes(address.toLowerCase())) {
      break;
    }

    let dataPackage = signedDataPackage.dataPackage;

    timestamp = Math.min(
      timestamp,
      Math.floor(dataPackage.timestampMilliseconds / 1000)
    );

    for (const dataPoint of dataPackage.dataPoints) {
      prices[dataPoint.dataFeedId].push(Number(hexlify(dataPoint.value)));
    }
  }

  const priceValues = dataFeedIds.map((feedId) => {
    const values = prices[feedId];
    assert(
      values.length >= uniqueSignerCountThreshold,
      `Insufficient signer count ${values.length} for '${feedId}'`
    );

    return getMedianValue(values);
  });

  return { priceValues, timestamp };
}

function getMedianValue(arr: number[]): number {
  if (arr.length === 0) {
    throw new Error("Cannot get median value of an empty array");
  }
  if (arr.some(isNaN)) {
    throw new Error(
      "Cannot get median value of an array that contains NaN value"
    );
  }

  arr = arr.sort((a, b) => a - b);

  const middle = Math.floor(arr.length / 2);

  if (arr.length % 2 === 0) {
    return (arr[middle] + arr[middle - 1]) / 2;
  } else {
    return arr[middle];
  }
}
