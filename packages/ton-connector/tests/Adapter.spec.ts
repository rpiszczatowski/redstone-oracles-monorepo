import { Blockchain } from "@ton-community/sandbox";
import { Cell } from "ton-core";
import { compile } from "@ton-community/blueprint";
import { Adapter } from "../wrappers/Adapter";
import "@ton-community/test-utils";
import { ContractParamsProvider, IPricesContractAdapter } from "redstone-sdk";
import { TestTonPricesContractConnector } from "./TestTonPricesContractConnector";

describe("Test", () => {
  let code: Cell;

  beforeAll(async () => {
    code = await compile("Adapter");
  });

  let blockchain: Blockchain;
  let adapter: IPricesContractAdapter;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    adapter = await new TestTonPricesContractConnector(
      blockchain,
      code
    ).getAdapter();
  });

  it("should get prices", async () => {
    const paramsProvider = new ContractParamsProvider({
      dataServiceId: "redstone-avalanche-prod",
      uniqueSignersCount: 4,
      dataFeeds: ["ETH", "BTC", "AVAX", "USDT"],
    });

    console.log(await adapter.getPricesFromPayload(paramsProvider));
  });

  // it("should sort", async () => {
  //   let numbers = [1, 6, 4, 9, 3, 7];
  //   console.log(await sut.getSort(numbers));
  //
  //   numbers = [2, 3, 1];
  //   console.log(await sut.getSort(numbers));
  // });
});
