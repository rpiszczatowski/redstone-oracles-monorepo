import { queryTransactions, Transaction } from "./common";
import { readJSON, saveJSON } from "../common/fs-utils";
import { sleep } from "../common/sleep";

const SLEEP_TIME_MS = 1000; // 1 second
const MAX_QUERY_RETRY_COUNT = 30;

main();

async function main() {
  const senderAddress = getSenderAddress();
  console.log(`Starting collection of transfers from: ${senderAddress}`);

  // Calculating file names
  const txsFilePath = `./txs-${senderAddress}.json`;
  const indexingStatusFilePath = `./indexing-status-${senderAddress}.json`;

  // Initialize
  let lastIndexedBlock: number = readJSON(indexingStatusFilePath, {
    lastIndexedBlock: 0,
  }).lastIndexedBlock;
  const allTransferTxs: Transaction[] = readJSON(txsFilePath, []);
  const savedTxHashes: { [txId: string]: boolean } = {};
  for (const tx of allTransferTxs) {
    savedTxHashes[tx.hash] = true;
  }

  while (true) {
    // Fetching on page
    console.log(`Fetching txs starting from block: ${lastIndexedBlock}`);
    await sleep(SLEEP_TIME_MS);
    const txs = await queryTransactions({
      startBlock: lastIndexedBlock,
      address: senderAddress,
      maxRetryCount: MAX_QUERY_RETRY_COUNT,
    });

    // Checking result and updating txs file
    if (txs.length === 0) {
      console.log(`Got 0 txs. Breaking the loop...`);
      break;
    } else {
      console.log(txs);
      console.log(
        `Fetched ${txs.length} txs starting from block: ${lastIndexedBlock}`
      );
      console.log(
        `Time of the last indexed tx: ${new Date(
          txs[txs.length - 1].timestamp * 1000
        )}`
      );
      console.log(`Currently saved transfers: ${allTransferTxs.length}`);

      const shouldStopAfterThisIteration =
        lastIndexedBlock == txs[txs.length - 1].blockNumber;

      // Update start block
      lastIndexedBlock = txs[txs.length - 1].blockNumber;

      // Filtering transactions that should be addded
      const txsToAdd = txs.filter(
        (tx) =>
          tx.value != "0" && // transfers
          tx.recipient !== senderAddress && // from sender
          !savedTxHashes[tx.hash] // (not saved before)
      );
      allTransferTxs.push(...txsToAdd);

      // Updating saved txs hashes
      for (const addedTx of txsToAdd) {
        savedTxHashes[addedTx.hash] = true;
      }

      // Updating files
      console.log(
        `Adding ${txsToAdd.length} new transfer txs to file: ${txsFilePath}`
      );
      saveJSON(allTransferTxs, txsFilePath);
      saveJSON({ lastIndexedBlock }, indexingStatusFilePath);

      if (shouldStopAfterThisIteration) {
        break;
      }
    }
  }
}

function getSenderAddress(): string {
  return process.argv[2] || "0x503828976d22510aad0201ac7ec88293211d23da";
}
