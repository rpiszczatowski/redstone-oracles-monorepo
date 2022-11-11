import { Consola } from "consola";
import { Transaction } from "../db/remote-mongo/models/Transaction";

const logger = require("../utils/logger")("score-by-address") as Consola;

export const validateAddressByKyc = async (
  address: string
): Promise<number> => {
  logger.info(`Fetching Coinbase KYC score for ${address}`);
  const transactionFromAddress = await Transaction.findOne(
    {
      recipient: address,
    },
    {},
    { sort: { blockNumber: "desc" } }
  );
  const isAddressValidated = !!transactionFromAddress;
  logger.info(
    `Address ${address} ${
      isAddressValidated ? "has" : "hasn't"
    } been validated by Coinbase}`
  );
  return isAddressValidated ? 1 : 0;
};
