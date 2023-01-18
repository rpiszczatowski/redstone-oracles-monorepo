const prompts = require("prompts");
const Web3 = require("web3");
const cliProgress = require("cli-progress");
const HashSet = require("hashset");

const REDSTONE_MARKER_HEX = "000002ed57011e0000";

const progressBar = new cliProgress.SingleBar(
  {},
  cliProgress.Presets.shades_classic
);

const web3 = new Web3("https://api.avax.network/ext/bc/C/rpc");

const getPromptQuestions = (latestBlockNumber) => {
  return [
    {
      type: "number",
      name: "blockCount",
      message: `How many blocks you want to query? (Current Block Number is: ${latestBlockNumber}`,
    },
  ];
};

const range = (start, stop, step) => {
  if (typeof stop == "undefined") {
    stop = start;
    start = 0;
  }

  if (typeof step == "undefined") {
    step = 1;
  }

  if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
    return [];
  }

  var result = [];
  for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
    result.push(i);
  }

  return result;
};

async function getTransactionsByCallData(
  latestBlock,
  blockCount,
  callData,
  blockPerPage = 50
) {
  let matchingTransactions = [];

  let startingBlock = latestBlock - blockCount;

  let i = startingBlock > 0 ? startingBlock : 0;
  let progressCounter = 0;

  progressBar.start(latestBlock - i, 0);

  while (i < latestBlock) {
    let promises = range(i, i + blockPerPage, 1).map((block) =>
      web3.eth.getBlock(block, true)
    );

    let blockResults = [];
    await Promise.all(promises).then((results) => {
      results.forEach((result) => blockResults.push(result));
    });

    for (let k = 0; k < blockResults.length; k++) {
      for (let j = 0; j < blockResults[k].transactions.length; j++) {
        const tx = blockResults[k].transactions[j];
        if (tx.input.endsWith(callData)) {
          matchingTransactions.push(tx);
        }
      }
    }
    progressCounter += blockPerPage;
    progressBar.update(progressCounter);
    i += blockPerPage;
  }

  progressBar.stop();
  return matchingTransactions;
}

const countUniqueAddresses = (transactions) => {
  let addresses = new HashSet();
  transactions.forEach((tx) => {
    addresses.add(tx.from);
    addresses.add(tx.to);
  });
  return addresses.length;
};

const getTotalGasPriceFromTransactions = (transactions) => {
  let totalGasPrice = web3.utils.toBN(0);
  transactions.forEach((tx) => {
    totalGasPrice = totalGasPrice.add(web3.utils.toBN(tx.gasPrice));
  });
  return totalGasPrice.toString();
};

const getCallDataSizeFromTransactions = (transactions) => {
  let totalCallDataSizeInBits = 0;

  transactions.forEach((tx) => {
    totalCallDataSizeInBits += (tx.input.length - 2) / 4;
  });
  return totalCallDataSizeInBits;
};

const getNumberOfFailedTx = (transactions) => {
  let invalidTransactions = 0;
  transactions.forEach((transaction) => {
    if (transaction.status === "0x0") {
      invalidTransactions++;
    }
  });
  return invalidTransactions;
};

const printStatistics = (
  totalTransactions,
  invalidTransactions,
  uniqueAddresses,
  totalGasPrice,
  totalCallDataSize
) => {
  console.log(`Total transactions: ${totalTransactions}`);
  console.log(`Invalid transactions: ${invalidTransactions}`);
  console.log(`Unique addresses in transactions: ${uniqueAddresses}`);
  console.log(`Total Gas Price Handled: ${totalGasPrice}`);
  console.log(
    `Total Call data handled: ${Math.floor(totalCallDataSize / 8)}Kb`
  );
};

const getStatisticsFromTransactions = (transactions) => {
  const totalTransactions = transactions.length;
  const invalidTransactions = getNumberOfFailedTx(transactions);
  const uniqueAddresses = countUniqueAddresses(transactions);
  const totalGasPrice = getTotalGasPriceFromTransactions(transactions);
  const totalCallDataSize = getCallDataSizeFromTransactions(transactions);
  printStatistics(
    totalTransactions,
    invalidTransactions,
    uniqueAddresses,
    totalGasPrice,
    totalCallDataSize
  );

  return;
};

async function query() {
  const latestBlock = await web3.eth.getBlockNumber();
  const { blockCount } = await prompts(getPromptQuestions(latestBlock));
  const transactions = await getTransactionsByCallData(
    latestBlock,
    blockCount,
    REDSTONE_MARKER_HEX,
    50
  );
  getStatisticsFromTransactions(transactions);
}

const run = async () => {
  try {
    await query();
  } catch (error) {
    console.log(error);
  }
};

run();
