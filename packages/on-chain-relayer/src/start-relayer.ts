import { Contract, Wallet } from "ethers";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { requestDataPackages } from "redstone-sdk";
import { getLastRoundParamsFromContract, getProvider } from "./utils";
import { config } from "./config";

(() => {
  const { privateKey, managerContractAddress, abi } = config;
  const relayerIterationInterval = Number(config.relayerIterationInterval);
  const updatePriceInterval = Number(config.updatePriceInterval);

  console.log(
    `Starting contract prices updater with interval ${relayerIterationInterval}`
  );

  setInterval(async () => {
    try {
      const provider = getProvider();
      const signer = new Wallet(privateKey, provider);

      const priceFeedsManagerContract = new Contract(
        managerContractAddress,
        abi,
        signer
      );

      const { lastRound, lastUpdateTimestamp } =
        await getLastRoundParamsFromContract(priceFeedsManagerContract);
      const currentTimestamp = Date.now();
      const isTwoMinutesSinceLastUpdate =
        currentTimestamp - lastUpdateTimestamp >= updatePriceInterval;
      if (!isTwoMinutesSinceLastUpdate) {
        console.log("Not enough time has passed to update prices");
      } else {
        const dataPackages = await requestDataPackages(
          {
            dataServiceId: "redstone-main-demo",
            uniqueSignersCount: 1,
            dataFeeds: ["OHM"],
          },
          ["https://d1zm8lxy9v2ddd.cloudfront.net"]
        );

        const wrappedContract = WrapperBuilder.wrap(
          priceFeedsManagerContract
        ).usingDataPackages(dataPackages);

        const dataPackageTimestamp =
          dataPackages.OHM[0].dataPackage.timestampMilliseconds;

        const updateTransaction = await wrappedContract.updateDataFeedValues(
          lastRound + 1,
          dataPackageTimestamp
        );
        await updateTransaction.wait();
        console.log("Successfully updated prices");
      }
    } catch (error: any) {
      console.log(error.stack);
    }
  }, relayerIterationInterval);
})();
