import { Blockchain, SandboxContract } from "@ton-community/sandbox";
import { Cell } from "ton-core";
import { compile } from "@ton-community/blueprint";
import { Adapter } from "../wrappers/Adapter";
import "@ton-community/test-utils";
import { ContractParamsProvider } from "redstone-sdk";

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

  it("should get prices", async () => {
    const paramsProvider = new ContractParamsProvider({
      dataServiceId: "redstone-avalanche-prod",
      uniqueSignersCount: 4,
      dataFeeds: ["ETH", "BTC", "AVAX", "USDT"],
    });

    console.log(await sut.getPrices(paramsProvider));
  });

  it("should sort", async () => {
    let numbers = [1, 6, 4, 9, 3, 7];
    console.log(await sut.getSort(numbers));

    numbers = [2, 3, 1];
    console.log(await sut.getSort(numbers));
  });
});
