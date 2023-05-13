import { utils } from "ethers";
import { ethers } from "hardhat";

// Usage: yarn run-script src/scripts/price-feeds/get-price.ts
// Note! You should configure the .env file properly before running this script

(async () => {
  const priceFeedFactory = await ethers.getContractFactory(
    "VoltzSofrPriceFeed"
  );
  const priceFeedContract = priceFeedFactory.attach(
    "0x89F48f6671Ec1B1C4f6abE964EBdd21F4eb7076f"
  );
  const latestAnswer = await priceFeedContract.latestAnswer();
  const price = utils.formatUnits(latestAnswer, 8);
  console.log({ price });
})();
