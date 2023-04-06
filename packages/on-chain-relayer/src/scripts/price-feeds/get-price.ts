import { Contract, utils } from "ethers";
import { getProvider } from "../../core/contract-interactions/get-provider-or-signer";
import { abi } from "../../../artifacts/contracts/price-feeds/interfaces/IPriceFeedAdapter.sol/IPriceFeedAdapter.json";

// Usage: yarn run-script src/scripts/price-feeds/get-price.ts
// Note! You should configure the .env file properly before running this script

const PRICE_FEED_ADDRESS = "";

(async () => {
  const provider = getProvider();
  const priceFeedContract = new Contract(PRICE_FEED_ADDRESS, abi, provider);
  const latestRoundData = await priceFeedContract.latestRoundData();
  const price = utils.formatUnits(latestRoundData.answer, 8);
  console.log(price);
})();
