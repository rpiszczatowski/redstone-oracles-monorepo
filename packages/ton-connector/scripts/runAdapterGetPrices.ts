import { Adapter } from "../wrappers/Adapter";
import { NetworkProvider } from "@ton-community/blueprint";
import * as dotenv from "dotenv";
import { ContractParamsProvider } from "redstone-sdk";

export async function run(provider: NetworkProvider) {
  dotenv.config();

  const contract = await Adapter.openForExecute<Adapter>(provider);

  const paramsProvider = new ContractParamsProvider({
    dataServiceId: "redstone-avalanche-prod",
    uniqueSignersCount: 3,
    dataFeeds: ["ETH", "BTC"],
  });

  console.log(await contract.getPrices(paramsProvider));
}
