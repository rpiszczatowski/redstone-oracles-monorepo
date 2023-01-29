import axios from "axios";
import dataToCompare from "../ETH-historical-prices-chainlink.json";
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
  fs.writeFile("ETH-historical-prices-redstone.json", json, "utf8", () => {});
};

function mapResponse(responseData: ResponseData): AgregatedData {
  console.log(responseData.value);
  const AgregatedDataObj: AgregatedData = {
    price: responseData.value,
    timestamp: Math.round(responseData.timestamp / 1000), // Redstone API returns timestamp in milliseconds
  };
  return AgregatedDataObj;
}

async function queryPrices(timestamp: number): Promise<AgregatedData> {
  const response = await axios.get("https://api.redstone.finance/prices", {
    params: {
      symbol: "ETH",
      provider: "redstone",
      toTimestamp: timestamp * 1000, // Redstone API query timestamp in milliseconds
      limit: "1",
    },
  });
  return mapResponse(response.data[0]);
}

const runScript = async () => {
  console.log("Querying specific historical prices from Redstone API...");
  const agregatedData: AgregatedData[] = [];
  for (let i = 0; i < dataToCompare.length; i++) {
    agregatedData.push(await queryPrices(dataToCompare[i].timestamp));
  }
  writeResults(agregatedData);
};

runScript();
