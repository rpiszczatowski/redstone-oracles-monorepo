import { Blockchain, SandboxContract } from "@ton-community/sandbox";
import { Cell } from "ton-core";
import { compile } from "@ton-community/blueprint";
import { Adapter } from "../wrappers/Adapter";
import "@ton-community/test-utils";
import { requestRedstonePayload } from "redstone-sdk";

describe("Test", () => {
  let code: Cell;

  beforeAll(async () => {
    code = await compile("Adapter");
  });

  let blockchain: Blockchain;
  let sut: SandboxContract<Adapter>;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    const deployer = await blockchain.treasury("deployer");
    sut = blockchain.openContract(
      Adapter.openForTest<Adapter>(code, deployer.getSender())
    );
    const deployResult = await sut.sendTestDeploy();
    // expect(deployResult.transactions).toHaveTransaction({
    //   from: deployer.address,
    //   to: sut.address,
    //   deploy: true,
    //   success: true,
    // });
  });

  it("should deploy", async () => {
    const reqParams = {
      dataServiceId: "redstone-avalanche-prod",
      uniqueSignersCount: 1,
      dataFeeds: ["ETH"],
    };

    const payloadHex = await requestRedstonePayload(reqParams);
    console.log(payloadHex);
    console.log(await sut.getVerify(payloadHex));
  });
});
