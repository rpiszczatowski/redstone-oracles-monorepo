import { BigNumber, Contract } from "ethers";

const parseBigNumberParam = (valueInBigNumber: BigNumber) =>
  valueInBigNumber.toNumber();

export type LastRoundParams = {
  lastRound: number;
  lastUpdateTimestamp: number;
};

export const getLastRoundParamsFromContract = async (
  managerContract: Contract
): Promise<LastRoundParams> => {
  const [lastRound, lastUpdateTimestamp] =
    await managerContract.getLastRoundParams();
  return {
    lastRound: parseBigNumberParam(lastRound),
    lastUpdateTimestamp: parseBigNumberParam(lastUpdateTimestamp),
  };
};
