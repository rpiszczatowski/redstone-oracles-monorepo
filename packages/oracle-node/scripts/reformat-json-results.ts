import resultString from "../results.json";
import fs from "fs";

interface ResponseData {
  price: string;
  timestamp: string;
}

interface AgregatedData {
  price: number;
  timestamp: number;
}

const writeResults = (results: AgregatedData[]) => {
  console.log("Saving results in correct json format");
  const json = JSON.stringify(results);
  fs.writeFile("ETH-historical-prices-chainlink.json", json, "utf8", () => {});
};

function mapResponse(response: ResponseData[]): AgregatedData[] {
  return response.map((item) => ({
    price: Number(item.price) / 1e6, // Chainlink returns price in 6 decimal places?
    timestamp: Number(item.timestamp),
  }));
}

writeResults(mapResponse(resultString));
