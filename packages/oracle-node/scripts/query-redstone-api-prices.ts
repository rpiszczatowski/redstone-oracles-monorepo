import axios from "axios";
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
  console.log("Saving results to file: ETH-historical-prices-redstone.json");
  const json = JSON.stringify(results);
  fs.writeFile("ETH-historical-prices-redstone.json", json, "utf8", () => {});
};

// function thst shrim response.data to a new object with only price and timestamp
function mapResponse(response: { data: ResponseData[] }): AgregatedData[] {
  return response.data.map((item) => ({
    price: item.value,
    timestamp: Math.round(item.timestamp / 1000), // Redstone API returns timestamp in milliseconds
  }));
}

async function queryPrices() {
  console.log("Querying historical prices from Redstone API...");
  const response = await axios.get("https://api.redstone.finance/prices", {
    params: {
      symbol: "ETH",
      provider: "redstone",
      //   fromTimestamp: "1619546099466",
      //   toTimestamp: "1619547041149",
      fromTimestamp: "1655383591000",
      toTimestamp: "1662564559000",
      interval: "3600000", // 1 hour
    },
  });
  writeResults(mapResponse(response));
}

const runScript = async () => {
  try {
    await queryPrices();
  } catch (error) {
    console.log(error);
  }
};

runScript();
