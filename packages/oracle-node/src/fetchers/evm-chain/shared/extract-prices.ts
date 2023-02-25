import { BigNumber, ethers } from "ethers";
import { MulticallParsedResponses } from "../../../types";

export const extractPriceForGlpToken = (
  multicallResult: MulticallParsedResponses,
  address: string
) => {
  const price = BigNumber.from(multicallResult[address].getPrice.value);
  return ethers.utils.formatUnits(price, 30);
};
