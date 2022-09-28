import * as dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import { sleep } from "../common/sleep";

export interface TxQuery {
  startBlock: number;
  address: string;
  maxRetryCount: number;
}

export interface RawTx {
  blockNumber: string;
  to: string;
  hash: string;
  timeStamp: string;
  value: string;
}

export interface QueryResponse {
  result: RawTx[];
}

export interface Transaction {
  hash: string;
  timestamp: number;
  recipient: string;
  value: string;
  blockNumber: number;
}

const SLEEP_MS_BEFORE_RETRY = 3000;
const TXS_PER_PAGE = 10000;
const ETHERSCAN_API_URL = "https://api.etherscan.io/api";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const BIG_END_BLOCK = 99999999;

// Got from etherscan
export const COINBASE_ADDRESSES = {
  "coinbase-1": "0x71660c4005ba85c37ccec55d0c4493e66fe775d3",
  "coinbase-2": "0x503828976d22510aad0201ac7ec88293211d23da",
  "coinbase-3": "0xddfabcdc4d8ffc6d5beaf154f18b778f892a0740",
  "coinbase-4": "0x3cd751e6b0078be393132286c442345e5dc49699",
  "coinbase-5": "0xb5d85cbf7cb3ee0d56b3bb207d5fc4b82f43f511",
  "coinbase-6": "0xeb2629a2734e272bcc07bda959863f316f4bd4cf",
  "coinbase-7": "0xd688aea8f7d450909ade10c47faa95707b0682d9",
  "coinbase-8": "0x02466e547bfdab679fc49e96bbfc62b9747d997c",
  "coinbase-9": "0x6b76f8b1e9e59913bfe758821887311ba1805cab",
  "coinbase-10": "0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43",
  "coinbase-miscellaneous": "0xa090e606e30bd747d4e6245a1517ebe430f0057e",
};

export const queryTransactions = async (
  txQuery: TxQuery
): Promise<Transaction[]> => {
  try {
    // Request
    const response = await axios.get(ETHERSCAN_API_URL, {
      params: {
        module: "account",
        action: "txlist",
        address: txQuery.address,
        startblock: txQuery.startBlock,
        endblock: BIG_END_BLOCK,
        page: 1,
        offset: TXS_PER_PAGE,
        sort: "asc", // from oldest to newest
        apikey: ETHERSCAN_API_KEY,
      },
    });

    // Parse reponse
    const txs = (response.data as QueryResponse).result.map((rawTx) => ({
      blockNumber: Number(rawTx.blockNumber),
      recipient: rawTx.to,
      hash: rawTx.hash,
      timestamp: Number(rawTx.timeStamp),
      value: rawTx.value,
    }));

    return txs;
  } catch (e) {
    console.log(`Query failed`);
    if (txQuery.maxRetryCount > 0) {
      console.log(`Will retry soon...`);
      await sleep(SLEEP_MS_BEFORE_RETRY);
      console.log(`Retrying...`);
      return await queryTransactions({
        ...txQuery,
        maxRetryCount: txQuery.maxRetryCount - 1,
      });
    } else {
      throw e;
    }
  }
};
