import { contracts, abi } from "../src/fetchers/chainlink/constants";
import { Contract, ethers } from "ethers";
import fs from "fs";
import { range } from "./utils";

const AGGREGATOR_V3_INTERFACE_ABI = abi;
const PRICE_FEED_ADDR = contracts["OHMv2"];

const provider = new ethers.providers.JsonRpcProvider(
  "https://api.avax.network/ext/bc/C/rpc"
);

interface PriceWithTimestamp {
  price: string;
  timestamp: bigint;
}

const getRoundId = async (priceFeedContract: Contract) => {
  return BigInt(
    (await priceFeedContract.latestRoundData()).roundId.toHexString()
  );
};

const getPhaseId = (roundId: bigint) => {
  const phaseId = Number(roundId >> 64n);
  return BigInt(phaseId);
};

const getAllPrices = async (priceFeed: Contract, latestPhaseId: bigint) => {
  let prices: PriceWithTimestamp[] = [];

  for (let i = latestPhaseId; i > 0; i--) {
    console.log(`Getting aggregator no. ${i} prices`);
    let aggregatorPrices = await getAggregatorPrices(priceFeed, i);
    console.log(
      `Got ${aggregatorPrices.length} prices from aggregator no. ${i}`
    );

    prices = [...prices, ...aggregatorPrices];
  }
  console.log("Got prices from all aggregators");
  return prices;
};

const getAggregatorPrices = async (contract: Contract, phaseId: bigint) => {
  let prices: PriceWithTimestamp[] = [];

  let roundID = (phaseId << 64n) | BigInt("1");

  let numErrors = 0;
  while (true) {
    try {
      let promises = range(roundID, roundID + BigInt("100"), BigInt(1)).map(
        (round: any) => contract.getRoundData(round)
      );
      let isReverted = false;
      await Promise.all(promises).then((results) => {
        results.forEach((answer) => {
          const price = BigInt(answer.answer);
          if (price === 0n) {
            isReverted = true;
          } else {
            const startedAtTimestamp = answer.startedAt;
            roundID++;
            prices.push({
              price: price.toString(),
              timestamp: startedAtTimestamp.toString(),
            });
            const date = new Date(
              Number(prices[prices.length - 1].timestamp) * 1000
            );
          }
        });
      });
      if (isReverted) {
        if (numErrors > 10) {
          break;
        }
        numErrors++;
      }
    } catch (error) {
      console.error(error);
      if (numErrors > 10) {
        break;
      }
      numErrors++;
    }
  }
  return prices;
};

const writeResults = (results: PriceWithTimestamp[]) => {
  console.log("Saving results to file");
  let json = JSON.stringify(results);
  fs.writeFile("results.json", json, "utf8", () => {});
};
async function query() {
  const priceFeed = new Contract(
    PRICE_FEED_ADDR,
    AGGREGATOR_V3_INTERFACE_ABI,
    provider
  );
  const roundId = await getRoundId(priceFeed);
  const phaseId = getPhaseId(roundId);
  let prices = await getAllPrices(priceFeed, phaseId);
  writeResults(prices);
}

const runScript = async () => {
  try {
    await query();
  } catch (error) {
    console.log(error);
  }
};

runScript();
