import { contracts, abi } from "../../src/fetchers/chainlink/constants";
import { Contract, ethers } from "ethers";
import { saveJSON } from "../common/fs-utils";

const AGGREGATOR_V3_INTERFACE_ABI = abi;
const PRICE_FEED_ADDR = contracts["OHMv2"];
const BATCH_SIZE = 100;
const MAX_REVERTS_COUNT_TO_EXIT_PHASE = 10;
const RESULT_FILE_PATH = "historical-chainlink-prices.json";

const provider = new ethers.providers.JsonRpcProvider(
  "https://api.avax.network/ext/bc/C/rpc"
);

interface PriceWithTimestamp {
  price: string;
  timestamp: bigint;
}

const getRoundId = async (priceFeedContract: Contract) => {
  const latestRoundData = await priceFeedContract.latestRoundData();
  return BigInt(latestRoundData.roundId.toHexString());
};

const getPhaseId = (roundId: bigint) => {
  const phaseId = Number(roundId >> 64n);
  return BigInt(phaseId);
};

const getAllPrices = async (priceFeed: Contract, latestPhaseId: bigint) => {
  let prices: PriceWithTimestamp[] = [];

  for (
    let currentPhaseId = latestPhaseId;
    currentPhaseId > 0;
    currentPhaseId--
  ) {
    console.log(`Getting aggregator no. ${currentPhaseId} prices`);
    const aggregatorPrices = await getAggregatorPrices(
      priceFeed,
      currentPhaseId
    );
    console.log(
      `Got ${aggregatorPrices.length} prices from aggregator no. ${currentPhaseId}`
    );

    prices = [...prices, ...aggregatorPrices];
  }
  console.log("Got prices from all aggregators");
  return prices;
};

const fetchPricesFromBatch = async (contract: Contract, startingRoundId) => {
  let roundId = startingRoundId;
  let batchPrices: PriceWithTimestamp[] = [];
  let numErrorsInBatch = 0;
  let isPhaseReverted = false;

  try {
    const promises = [...Array(BATCH_SIZE).keys()].map((round: number) =>
      contract.getRoundData(BigInt(round))
    );

    let isReverted = false;
    await Promise.all(promises).then((results) => {
      results.forEach((answer) => {
        const price = BigInt(answer.answer);
        if (price === 0n) {
          isReverted = true;
        } else {
          const startedAtTimestamp = answer.startedAt;
          roundId++;
          batchPrices.push({
            price: price.toString(),
            timestamp: startedAtTimestamp.toString(),
          });
        }
      });
    });
    if (isReverted) {
      numErrorsInBatch++;
    }
  } catch (error) {
    console.error(error);
    numErrorsInBatch++;
  }
  if (numErrorsInBatch > MAX_REVERTS_COUNT_TO_EXIT_PHASE) {
    isPhaseReverted = true;
  }
  return { batchPrices, isPhaseReverted };
};
const getAggregatorPrices = async (contract: Contract, phaseId: bigint) => {
  let prices: PriceWithTimestamp[] = [];
  let roundID = (phaseId << 64n) | BigInt("1");

  while (true) {
    const { batchPrices, isPhaseReverted } = await fetchPricesFromBatch(
      contract,
      roundID
    );
    prices = [...prices, ...batchPrices];
    if (isPhaseReverted) {
      break;
    }
  }

  return prices;
};

async function main() {
  const priceFeed = new Contract(
    PRICE_FEED_ADDR,
    AGGREGATOR_V3_INTERFACE_ABI,
    provider
  );
  const roundId = await getRoundId(priceFeed);
  const phaseId = getPhaseId(roundId);
  const prices = await getAllPrices(priceFeed, phaseId);
  saveJSON(prices, RESULT_FILE_PATH);
}

const runScript = async () => {
  try {
    await main();
  } catch (error) {
    console.log(error);
  }
};

runScript();
