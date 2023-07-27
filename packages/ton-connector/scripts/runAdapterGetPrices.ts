import { Adapter } from "../wrappers/Adapter";
import { NetworkProvider } from "@ton-community/blueprint";
import * as dotenv from "dotenv";
import { requestRedstonePayload } from "redstone-sdk";

export async function run(provider: NetworkProvider) {
  dotenv.config();

  const contract = await Adapter.openForExecute<Adapter>(provider);

  const dataFeeds = ["ETH", "BTC"];
  const reqParams = {
    dataServiceId: "redstone-avalanche-prod",
    uniqueSignersCount: 3,
    dataFeeds,
  };
  const payloadHex = await requestRedstonePayload(reqParams);

  console.log(await contract.getPrices(dataFeeds, payloadHex));
}