import { NetworkProvider } from "@ton-community/blueprint";
import * as dotenv from "dotenv";
import { Feed } from "../wrappers/Feed";

export async function run(provider: NetworkProvider) {
  dotenv.config();

  const contract = await Feed.openForExecute<Feed>(provider);

  console.log(await contract.getFeedValue());
}