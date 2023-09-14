import { config } from "./config";
import { ContractConnectorFactory } from "./starknet/ContractConnectorFactory";
import { startSimpleRelayer } from "@redstone-finance/sdk";

(async () => {
  await startSimpleRelayer(
    config,
    ContractConnectorFactory.makePriceManagerContractConnector()
  );
})();
