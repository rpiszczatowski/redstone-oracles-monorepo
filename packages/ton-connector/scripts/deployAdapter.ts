import { NetworkProvider } from "@ton-community/blueprint";
import * as dotenv from "dotenv";
import { TonPricesContractDeployer } from "../src/prices/TonPricesContractConnector";

export async function run(provider: NetworkProvider) {
  dotenv.config();

  const contract = await new TonPricesContractDeployer(provider).getAdapter();

  await contract.sendDeploy();
}
