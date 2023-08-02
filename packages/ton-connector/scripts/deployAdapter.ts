import { NetworkProvider } from "@ton-community/blueprint";
import * as dotenv from "dotenv";
import { TonPricesContractConnector } from "../src/prices/TonPricesContractConnector";

export async function run(provider: NetworkProvider) {
  dotenv.config();

  const contract = await new TonPricesContractConnector(provider).getAdapter();

  await contract.sendDeploy();
}
