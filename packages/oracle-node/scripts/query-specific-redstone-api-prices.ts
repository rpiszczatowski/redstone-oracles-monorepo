import axios from "axios";
const cryptocurrency = "ETH"; //change to any other cryptocurrency
// import dataToCompare from `../${cryptocurrency}-historical-prices-chainlink.json`;
const dataToCompare = require(`../${cryptocurrency}-historical-prices-chainlink.json`);
// import dataToCompare from "../OHMv2-historical-prices-chainlink.json";
import fs from "fs";

interface ResponseData {
  value: number;
  timestamp: number;
  [otherOptions: string]: unknown;
}

interface AgregatedData {
  price: number;
  timestamp: number;
}

const writeResults = (results: AgregatedData[]) => {
  console.log("Saving results to file: historical-prices-redstone.json");
  const json = JSON.stringify(results);
  // fs.writeFile("ETH-historical-prices-redstone.json", json, "utf8", () => {});
  fs.writeFile(
    `${cryptocurrency}-historical-prices-redstone.json`,
    json,
    "utf8",
    () => {}
  );
};

function mapResponse(responseData: ResponseData): AgregatedData {
  const AgregatedDataObj: AgregatedData = {
    price: responseData.value,
    timestamp: Math.round(responseData.timestamp / 1000), // Redstone API returns timestamp in milliseconds
  };
  return AgregatedDataObj;
}

async function queryPrices(
  requests: AgregatedData[]
): Promise<AgregatedData[]> {
  const promises = requests.map((request) => {
    return axios.get("https://api.redstone.finance/prices", {
      params: {
        // symbol: "ETH",
        symbol: cryptocurrency,
        provider: "redstone",
        toTimestamp: request.timestamp * 1000, // Redstone API query timestamp in milliseconds
        limit: "1",
      },
    });
  });
  // try catch?
  const responses = await Promise.all(promises);
  return responses.map((response) => mapResponse(response.data[0]));
}

const runScript = async () => {
  console.log("Querying specific historical prices from Redstone API...");
  const agregatedData: AgregatedData[] = [];
  console.log(`Total number of prices to query: ${dataToCompare.length}`);
  for (let i = 0; i < dataToCompare.length; i += 100) {
    if (i % 1000 === 0) {
      console.log(`Querying ${i}th price...`);
    }
    // call queryPrices for 100 elements from dataToCompare at a time
    try {
      const result = await queryPrices(dataToCompare.slice(i, i + 100));
      agregatedData.push(...result);
    } catch {
      console.log("Error occured");
    }
  }
  writeResults(agregatedData);
};

runScript();
