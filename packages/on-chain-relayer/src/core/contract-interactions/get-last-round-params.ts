import { BigNumber, Contract } from "ethers";

const parseBigNumberParam = (valueInBigNumber: BigNumber) =>
  valueInBigNumber.toNumber();

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
