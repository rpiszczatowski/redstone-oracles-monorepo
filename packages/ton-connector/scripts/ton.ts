import { TonDeployer } from "../src/TonDeployer";
import {
  Adapter,
  GetKeyAdapterContractExecutor,
  SendInitAdapterContractExecutor,
  SendMessageAdapterContractExecutor,
} from "../src/Adapter";
import { DeployableContract } from "../src/DeployableContract";
import fs from "fs";
import {
  GetFeedValueFeedContractExecutor,
  SendMessageFeedContractExecutor,
} from "../src/Feed";

async function main() {
  const argv = require("minimist")(process.argv.slice(2));
  const adapterAddress = await fs.promises.readFile(
    `deploy/adapter.address`,
    "utf8"
  );
  const feedAddress = await fs.promises.readFile(`deploy/feed.address`, "utf8");

  switch (argv["op"]) {
    case "deploy-adapter":
      return await new TonDeployer(
        Adapter.createForDeploy("adapter")
      ).perform();

    case "deploy-feed":
      return await new TonDeployer(
        DeployableContract.createForDeploy("feed")
      ).perform();

    case "init-adapter":
      await new SendInitAdapterContractExecutor(adapterAddress).perform();
      console.log(
        await new GetKeyAdapterContractExecutor(adapterAddress).perform()
      );

      break;

    case "send-message":
      await new SendMessageAdapterContractExecutor(adapterAddress).perform();
      console.log(
        await new GetKeyAdapterContractExecutor(adapterAddress).perform()
      );

      break;

    case "get-feed-value":
      console.log(
        await new GetFeedValueFeedContractExecutor(feedAddress).perform()
      );

      console.log(
        await new GetKeyAdapterContractExecutor(adapterAddress).perform()
      );

      break;

    case "fetch-feed-value":
      await new SendMessageFeedContractExecutor(feedAddress).perform();
      console.log(
        await new GetFeedValueFeedContractExecutor(feedAddress).perform()
      );
      console.log(
        await new GetKeyAdapterContractExecutor(adapterAddress).perform()
      );

      break;

    case "get-key":
      console.log(
        await new GetKeyAdapterContractExecutor(adapterAddress).perform()
      );

      break;

    default:
      throw `Unknown op: '${argv["op"]}'`;
  }
}

main();
