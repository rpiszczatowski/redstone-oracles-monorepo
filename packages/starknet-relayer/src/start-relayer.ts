import { config } from "./config";
import { ContractConnectorFactory } from "./starknet/ContractConnectorFactory";

(async () => {
  const relayerIterationInterval = Number(config.relayerIterationInterval);
  const updatePriceInterval = Number(config.updatePriceInterval);
  const connector =
    ContractConnectorFactory.makePriceManagerContractConnector();
  const adapter = await connector.getAdapter();

  let pendingTransactionHash: string | undefined;

  console.log(
    `Starting contract prices updater with interval ${
      relayerIterationInterval / 1000
    } s.`
  );

  setInterval(async () => {
    let txHash: string | undefined;

    try {
      if (pendingTransactionHash != undefined) {
        return console.log(
          `Skipping, because there exists a pending transaction: ${pendingTransactionHash}`
        );
      }
      const timestampAndRound = await adapter.readTimestampAndRound();

      const currentTimestamp = Date.now();
      let timestampDelta =
        currentTimestamp - timestampAndRound.payload_timestamp;
      const isEnoughTimeElapsedSinceLastUpdate =
        timestampDelta >= updatePriceInterval;
      if (!isEnoughTimeElapsedSinceLastUpdate) {
        return console.log(
          `Skipping, because not enough time has passed to update prices (${
            timestampDelta / 1000
          } s. of ${updatePriceInterval / 1000} s.)`
        );
      }

      pendingTransactionHash = "...";
      txHash = await adapter.writePrices(timestampAndRound.round + 1);
      console.log(
        `Started updating prices (round: ${
          timestampAndRound.round + 1
        }) with transaction: ${txHash}`
      );
      pendingTransactionHash = txHash;
      console.log(`Waiting for the transaction's status changes...`);
      await connector.waitForTransaction(txHash!);
    } catch (error: any) {
      console.error(error.stack || error);
    } finally {
      if (
        pendingTransactionHash === txHash ||
        pendingTransactionHash === "..."
      ) {
        pendingTransactionHash = undefined;
      }
    }
  }, relayerIterationInterval);
})();
