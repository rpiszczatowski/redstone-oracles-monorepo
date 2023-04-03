import { BigNumber, Contract, utils } from "ethers";

const parseBigNumberParam = (valueInBigNumber: BigNumber) => {
  const value = Number(utils.formatUnits(valueInBigNumber, 0));

  if (value > Number.MAX_SAFE_INTEGER) {
    throw new Error(`Too big number for JS occurred: ${value}`);
  }

  return value;
};

export const getLastRoundParamsFromContract = async (
  managerContract: Contract
): Promise<{ lastRound: number; lastUpdateTimestamp: number }> => {
  const [lastRound, lastUpdateTimestamp] =
    await managerContract.getLastRoundParams();
  return {
    lastRound: parseBigNumberParam(lastRound),
    lastUpdateTimestamp: parseBigNumberParam(lastUpdateTimestamp),
  };
};
