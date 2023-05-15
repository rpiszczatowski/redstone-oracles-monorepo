import { Blockchain } from "@ton-community/sandbox";
import { Cell } from "ton-core";
import { compile } from "@ton-community/blueprint";
import "@ton-community/test-utils";
import { ContractParamsProvider } from "redstone-sdk";
import { TonPriceFeedContractAdapter } from "../src/price-feed/TonPriceFeedContractAdapter";
import { TonPriceManagerContractAdapter } from "../src/price-manager/TonPriceManagerContractAdapter";
import { PriceFeedInitData } from "../src/price-feed/PriceFeedInitData";
import { PriceManagerInitData } from "../src/price-manager/PriceManagerInitData";

import { TestTonNetwork } from "./TestTonNetwork";
import { TonPriceFeedContractDeployer } from "../src/price-feed/TonPriceFeedContractDeployer";
import { TonPriceManagerContractDeployer } from "../src/price-manager/TonPriceManagerContractDeployer";

jest.setTimeout(10000);

describe("Ton Prices Tests", () => {
  let priceManagerCode: Cell;
  let priceFeedCode: Cell;

  beforeAll(async () => {
    priceManagerCode = await compile("price_manager");
    priceFeedCode = await compile("price_feed");
  });

  let blockchain: Blockchain;
  let priceManager: TonPriceManagerContractAdapter;
  let pricesFeed: TonPriceFeedContractAdapter;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    const deployer = await blockchain.treasury("deployer");
    const network = new TestTonNetwork(blockchain, deployer);

    priceManager = await new TonPriceManagerContractDeployer(
      network,
      priceManagerCode,
      new PriceManagerInitData(1, [
        "0x109B4A318A4F5DDCBCA6349B45F881B4137DEAFB",
        "0x12470F7ABA85C8B81D63137DD5925D6EE114952B",
        "0x1EA62D73EDF8AC05DFCEA1A34B9796E937A29EFF",
        "0x2C59617248994D12816EE1FA77CE0A64EEB456BF",
        "0x83CBA8C619FB629B81A65C2E67FE15CF3E3C9747",
      ])
    ).getAdapter();

    pricesFeed = await new TonPriceFeedContractDeployer(
      network,
      priceFeedCode,
      new PriceFeedInitData("USDT", priceManager.contract.address.toString())
    ).getAdapter();
  });

  it("should deploy", async () => {
    console.log(await pricesFeed.getData());
  });

  it("should get prices", async () => {
    const paramsProvider = new ContractParamsProvider({
      dataServiceId: "redstone-avalanche-prod",
      uniqueSignersCount: 4,
      dataFeeds: ["ETH", "BTC", "AVAX", "USDT"],
    });

    console.log(await priceManager.getPricesFromPayload(paramsProvider));
  });

  it("should write and read prices", async () => {
    const paramsProvider = new ContractParamsProvider({
      dataServiceId: "redstone-avalanche-prod",
      uniqueSignersCount: 4,
      dataFeeds: ["ETH", "BTC", "AVAX", "USDT"],
    });

    await priceManager.writePricesFromPayloadToContract(paramsProvider);
    console.log(await priceManager.readPricesFromContract(paramsProvider));
    console.log(await priceManager.readTimestampFromContract());

    await pricesFeed.fetchData();
    console.log(await pricesFeed.getData());
  });
});
