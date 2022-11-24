import axios from "axios";
import { Consola } from "consola";
import { config } from "../config";
import { Transaction } from "../db/remote-mongo/models/Transaction";
import redstone from "redstone-api";

const logger = require("../utils/logger")("score-by-address") as Consola;

const BIG_END_BLOCK = 99999999;
const TXS_PER_PAGE = 10000;
const LEVEL_2_MIN_USD_AMOUNT = 100;
const WEI_TO_ETH_MULTIPLIER = 10 ** -18;

const COINBASE_ADDRESSES = [
  "0x71660c4005ba85c37ccec55d0c4493e66fe775d3",
  "0x503828976d22510aad0201ac7ec88293211d23da",
  "0xddfabcdc4d8ffc6d5beaf154f18b778f892a0740",
  "0x3cd751e6b0078be393132286c442345e5dc49699",
  "0xb5d85cbf7cb3ee0d56b3bb207d5fc4b82f43f511",
  "0xeb2629a2734e272bcc07bda959863f316f4bd4cf",
  "0xd688aea8f7d450909ade10c47faa95707b0682d9",
  "0x02466e547bfdab679fc49e96bbfc62b9747d997c",
  "0x6b76f8b1e9e59913bfe758821887311ba1805cab",
  "0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43",
  "0xa090e606e30bd747d4e6245a1517ebe430f0057e",
];

export interface RawTx {
  blockNumber: string;
  from: string;
  to: string;
  hash: string;
  timeStamp: string;
  value: string;
}

export interface QueryResponse {
  result: RawTx[];
}

export const validateAddressByCoinbaseData = async (
  address: string
): Promise<number> => {
  logger.info(`Fetching Coinbase KYD score for ${address}`);
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

export const determineAddressLevelByCoinbaseData = async (
  address: string
): Promise<number> => {
  const transactions = await fetchTransactionForAddress(address);
  const transactionsFromCoinbase = transactions.filter((transaction) =>
    COINBASE_ADDRESSES.includes(transaction.from)
  );
  const sumFromCoinbaseTransactions = transactionsFromCoinbase.reduce(
    (sum, transaction) => (sum += Number(transaction.value)),
    0
  );
  const lastEthPrice = (await redstone.getPrice("ETH")).value;
  const transactionsSumInUSD =
    sumFromCoinbaseTransactions * WEI_TO_ETH_MULTIPLIER * lastEthPrice;
  const transactionsCount = transactions.length;
  const transactionsFromCoinbaseCount = transactionsFromCoinbase.length;
  return assignAddressLevel(
    transactionsCount,
    transactionsFromCoinbaseCount,
    transactionsSumInUSD
  );
};

const fetchTransactionForAddress = async (
  address: string,
  page: number = 1
) => {
  const { etherscanApiUrl, etherscanApiKey } = validateEtherscanConfig();
  const etherscanRequestParams = {
    module: "account",
    action: "txlist",
    address: address,
    startblock: 0,
    endblock: BIG_END_BLOCK,
    page,
    offset: TXS_PER_PAGE,
    sort: "asc",
    apikey: etherscanApiKey,
  };
  const response = await axios.get(etherscanApiUrl, {
    params: etherscanRequestParams,
  });
  let transactions = (response.data as QueryResponse).result;
  validateEtherscanResponse(transactions);
  const transactionFromNextPage = await fetchMoreTransactionsIfPaginated(
    transactions.length,
    address,
    page
  );
  return [...transactions, ...transactionFromNextPage];
};

const validateEtherscanConfig = () => {
  const { etherscanApiUrl, etherscanApiKey } = config;
  if (!(etherscanApiUrl && etherscanApiKey)) {
    throw new Error("Invalid Etherscan API config");
  }
  return { etherscanApiUrl, etherscanApiKey };
};

const validateEtherscanResponse = (transactions: any) => {
  if (typeof transactions !== "object") {
    const errMsg = "Invalid type of response from etherscan: " + transactions;
    throw new Error(errMsg);
  }
};

const fetchMoreTransactionsIfPaginated = async (
  transactionsCount: number,
  address: string,
  page: number
): Promise<RawTx[]> => {
  if (transactionsCount >= TXS_PER_PAGE) {
    return await fetchTransactionForAddress(address, page + 1);
  }
  return [];
};

const assignAddressLevel = (
  transactionsCount: number,
  transactionsFromCoinbaseCount: number,
  transactionsSumInUSD: number
) => {
  if (
    transactionsCount > 0 &&
    transactionsFromCoinbaseCount > 0 &&
    transactionsCount === transactionsFromCoinbaseCount
  ) {
    return 3;
  }
  if (transactionsSumInUSD > LEVEL_2_MIN_USD_AMOUNT) {
    return 2;
  }
  if (transactionsFromCoinbaseCount > 0) {
    return 1;
  }
  return 0;
};
