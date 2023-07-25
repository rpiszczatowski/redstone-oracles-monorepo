import { Adapter } from "../wrappers/Adapter";
import { NetworkProvider } from "@ton-community/blueprint";
import * as dotenv from "dotenv";

export async function run(provider: NetworkProvider) {
  dotenv.config();

  const contract = await Adapter.openForDeploy(provider);

  await contract.sendDeploy();
}