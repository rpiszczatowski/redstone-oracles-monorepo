import { Provider } from "fuels";
import { ContractParamsProvider } from "redstone-sdk";
import { connectPricesContract } from "./prices-contract-test-utils";

jest.setTimeout(10 * 60000);

const IS_LOCAL = 1;

// 	For the beta-2 node the 'fuels' version must not be greater than 0.32.0
const provider = IS_LOCAL
  ? undefined
  : new Provider("https://beta-3.fuel.network/graphql");

describe("Integrated and initialized prices contract", () => {
  it("write_prices should write the price data that can be read then", async () => {
    const adapter = await connectPricesContract(provider);
    const paramsProvider = new ContractParamsProvider({
      dataServiceId: "redstone-avalanche-prod",
      uniqueSignersCount: 2,
      dataFeeds: ["ETH", "BTC"],
    });

    await adapter.writePricesFromPayloadToContract(paramsProvider);
    const prices = await adapter.readPricesFromContract(paramsProvider);
    const timestamp = await adapter.readTimestampFromContract();

    const localTimestamp = Date.now();

    const TEN_MINUTES = 1000 * 60 * 10;
    expect(timestamp).toBeLessThan(localTimestamp + TEN_MINUTES);
    expect(timestamp).toBeGreaterThan(localTimestamp - TEN_MINUTES);

    const CHANGE_FACTOR = 0.5;
    const BASE_ETH_PRICE = 160000000000;
    const BASE_BTC_PRICE = 2250000000000;

    expect(prices[0]).toBeLessThan(BASE_ETH_PRICE * (1 + CHANGE_FACTOR));
    expect(prices[0]).toBeGreaterThan(BASE_ETH_PRICE * (1 - CHANGE_FACTOR));
    expect(prices[1]).toBeLessThan(BASE_BTC_PRICE * (1 + CHANGE_FACTOR));
    expect(prices[1]).toBeGreaterThan(BASE_BTC_PRICE * (1 - CHANGE_FACTOR));
  });
});
