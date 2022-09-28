import { BigNumber } from "ethers";
import { readJSON, saveJSON } from "../common/fs-utils";
import { Transaction } from "./common";

interface RecipientsReport {
  [recipientAddress: string]: string;
}

const TXS_FILES = [
  "./txs-0x71660c4005ba85c37ccec55d0c4493e66fe775d3.json",
  "./txs-0x503828976d22510aad0201ac7ec88293211d23da.json",
  "./txs-0xddfabcdc4d8ffc6d5beaf154f18b778f892a0740.json",
  "./txs-0x3cd751e6b0078be393132286c442345e5dc49699.json",
  "./txs-0xb5d85cbf7cb3ee0d56b3bb207d5fc4b82f43f511.json",
  "./txs-0xeb2629a2734e272bcc07bda959863f316f4bd4cf.json",
  "./txs-0xd688aea8f7d450909ade10c47faa95707b0682d9.json",
  "./txs-0x02466e547bfdab679fc49e96bbfc62b9747d997c.json",
  "./txs-0x6b76f8b1e9e59913bfe758821887311ba1805cab.json",
  "./txs-0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43.json",
  "./txs-0xa090e606e30bd747d4e6245a1517ebe430f0057e.json",
];
const OUTPUT_FILE = `./kyc-coinbase-report.json`;

main();

function main() {
  const recipientsReport: RecipientsReport = {};

  for (const txFilePath of TXS_FILES) {
    console.log(`Summarizing details from file: ${txFilePath}`);
    const txs = readJSON(txFilePath) as Transaction[];

    for (const tx of txs) {
      if (recipientsReport[tx.recipient]) {
        const currentBalance = BigNumber.from(recipientsReport[tx.recipient]);
        const txValue = BigNumber.from(tx.value);
        recipientsReport[tx.recipient] = currentBalance.add(txValue).toString();
      } else {
        recipientsReport[tx.recipient] = tx.value;
      }
    }

    console.log(`Updating report: ${OUTPUT_FILE}`);
    saveJSON(recipientsReport, OUTPUT_FILE);
  }
}
