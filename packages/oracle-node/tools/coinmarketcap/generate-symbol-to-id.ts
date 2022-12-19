import axios from "axios";
import fs from "fs";

const API_KEY = "";
const PATH = "./src/fetchers/coinmarketcap/symbol-to-id.json";

(async () => {
  const idMap = await axios.get(
    "https://pro-api.coinmarketcap.com/v1/cryptocurrency/map",
    {
      headers: {
        "X-CMC_PRO_API_KEY": API_KEY,
      },
    }
  );
  const coins = idMap.data.data;
  const result = {} as Record<string, number>;
  for (const coin of coins) {
    if (coin.symbol === "QI" && coin.slug !== "benqi") {
      continue;
    }
    result[coin.symbol] = coin.id;
  }
  fs.writeFileSync(PATH, JSON.stringify(result));
  console.log(`Saving symbol-to-id file to: ${PATH}`);
})();
