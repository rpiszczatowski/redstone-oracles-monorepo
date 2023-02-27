import { config } from "./config";
import Level from "level-ts";
import { FuelConnector } from "@redstone-finance/fuel-connector";

interface Entry {
  blockHeight: string;
  blockTimestamp: number;
  localTimestamp: number;
  timestampDelta: number;
}

const database = new Level<Entry>("./database");

(() => {
  const { rpcUrl } = config;
  const iterationInterval = Number(config.iterationInterval);
  const fuel = new FuelConnector(rpcUrl);

  console.log(
    `Starting timestamp analysis with interval ${iterationInterval / 1000} s.`
  );

  setInterval(async () => {
    try {
      const subtrahend = BigInt(
        "0b100000000000000000000000000000000000000000000000000000000001010" // 2^62 + 10
      );

      const localTimestamp = new Date().getTime();
      const { height, time } = await fuel.getLatestBlock();
      const blockTime = BigInt(time);
      const blockTimestamp = Number(blockTime - subtrahend) * 1000;

      let timestampDelta = localTimestamp - blockTimestamp;
      await database.put(`${localTimestamp}`, {
        blockTimestamp,
        localTimestamp,
        blockHeight: height,
        timestampDelta,
      });

      console.log(
        `Successfully updated timestamps at ${localTimestamp} (delta: ${
          timestampDelta / 1000
        } s.)`
      );
    } catch (error: any) {
      console.log(error.stack);
    }
  }, iterationInterval);
})();
