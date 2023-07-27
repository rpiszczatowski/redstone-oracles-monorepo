import { NetworkProvider } from "@ton-community/blueprint";
import * as dotenv from "dotenv";
import { ContractParamsProvider } from "redstone-sdk";
import { TonPricesContractConnector } from "../src/prices/TonPricesContractConnector";

export async function run(provider: NetworkProvider) {
  dotenv.config();

  const contract = await new TonPricesContractConnector(provider).getAdapter();

  const paramsProvider = new ContractParamsProvider({
    dataServiceId: "redstone-avalanche-prod",
    uniqueSignersCount: 3,
    dataFeeds: ["ETH", "BTC"],
  });

  console.log(await contract.getPricesFromPayload(paramsProvider));
}
