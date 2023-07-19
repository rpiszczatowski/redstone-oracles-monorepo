import { Adapter } from "../src/Adapter";
import * as fs from "fs";
import { Feed } from "../src/Feed";

async function main() {
  const argv = require("minimist")(process.argv.slice(2));
  const adapterAddress = await fs.promises.readFile(
    `deploy/adapter.address`,
    "utf8"
  );

  const feedAddress = await fs.promises.readFile(`deploy/feed.address`, "utf8");

  switch (argv["op"]) {
    case "deploy-adapter":
      return await (await Adapter.createForDeploy("adapter")).sendDeploy();

    case "deploy-feed":
      return await (await Feed.createForDeploy("feed")).sendDeploy();

    case "init-adapter":
      await (
        await Adapter.createForExecute<Adapter>(adapterAddress)
      ).sendInit();

      break;

    case "send-message":
      await (
        await Adapter.createForExecute<Adapter>(adapterAddress)
      ).sendMessage();

      break;

    case "get-feed-value":
      console.log(
        await (await Feed.createForExecute<Feed>(feedAddress)).getFeedValue()
      );

      break;

    case "fetch-feed-value":
      await (await Feed.createForExecute<Feed>(feedAddress)).sendMessage();
      console.log(
        await (await Feed.createForExecute<Feed>(feedAddress)).getFeedValue()
      );

      break;

    case "get-key":
      break;

    case "recover":
      console.log(
        await (
          await Adapter.createForExecute<Adapter>(adapterAddress)
        ).getRecover()
      );

      return;

    case "verify":
      console.log(
        await (
          await Adapter.createForExecute<Adapter>(adapterAddress)
        ).getVerify()
      );

      return;

    default:
      throw `Unknown op: '${argv["op"]}'`;
  }

  console.log(
    await (await Adapter.createForExecute<Adapter>(adapterAddress)).getKey(333)
  );
}

main();
