import { Feed } from "../wrappers/Feed";
import { NetworkProvider } from "@ton-community/blueprint";
import * as dotenv from "dotenv";

export async function run(provider: NetworkProvider) {
  dotenv.config();

  const contract = await Feed.connectForDeploy(provider);

  await contract.sendDeploy();
}
