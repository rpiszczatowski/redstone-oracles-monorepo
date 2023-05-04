import { Provider } from "fuels";
import { ContractParamsProvider } from "redstone-sdk";
import { connectPricesContract } from "./prices-contract-test-utils";

jest.setTimeout(10 * 60000);

const IS_LOCAL = 1;

const provider = IS_LOCAL
  ? undefined
  : new Provider("https://beta-3.fuel.network/graphql");

describe("Gas Usage of integrated and initialized prices contract", () => {
  it("write_prices should write the price data that can be read then", async () => {
    const minDataFeeds = ["ETH"];
    const maxDataFeeds = ["ETH", "BTC", "AVAX"];
    const minSignerCount = 1;
    const maxSignerCount = 4;

    const minSize = minDataFeeds.length * minSignerCount;
    const maxSize = maxDataFeeds.length * maxSignerCount;

    await performGasUsageTests(minSignerCount, minDataFeeds); // :1
    await performGasUsageTests(minSignerCount, maxDataFeeds); // :3
    await performGasUsageTests(maxSignerCount, maxDataFeeds); // :12

    // c + min * p = a_min
    // c + max * p = a_max,
    // so... p = (a_max - a_min) / (max - min), c = a_max - min * p

    for (let obj of [
      { func: "get_prices", maxSize, subject: "packages" },
      { func: "write_prices", maxSize, subject: "packages" },
      { func: "write_prices", maxSize: 3, subject: "feeds" },
      { func: "read_prices", maxSize: 3, subject: "feeds" },
      { func: "read_timestamp", maxSize, subject: "packages" },
    ]) {
      const maxSize = obj.maxSize;

      const maxGasUsage = results[`${obj.func}:${maxSize}`];
      const minGasUsage = results[`${obj.func}:${minSize}`];

      const perSubject = Math.round(
        (maxGasUsage - minGasUsage) / (maxSize - minSize)
      );
      const perSubjectConst = minGasUsage - perSubject * minSize;

      console.log(
        `${obj.func} costs: ${perSubjectConst} + ${perSubject} * #${obj.subject}, min: ${minGasUsage} for ${minSize} ${obj.subject}, max: ${maxGasUsage} for ${obj.maxSize} ${obj.subject}`
      );
    }
  });

  const results: { [invocation: string]: number } = {};

  async function performGasUsageTests(
    uniqueSignerCount: number,
    dataFeeds: string[]
  ) {
    const adapter = await connectPricesContract(provider, true);
    const paramsProvider = new ContractParamsProvider({
      dataServiceId: "redstone-avalanche-prod",
      uniqueSignersCount: uniqueSignerCount,
      dataFeeds: dataFeeds,
    });

    let gasUsage = await adapter.getPricesFromPayload(paramsProvider);
    logAndSaveResults("get_prices", uniqueSignerCount, dataFeeds, gasUsage[0]);

    gasUsage = (await adapter.writePricesFromPayloadToContract(
      paramsProvider
    )) as number[];
    logAndSaveResults(
      "write_prices",
      uniqueSignerCount,
      dataFeeds,
      gasUsage[0]
    );

    gasUsage = (await adapter.readPricesFromContract(
      paramsProvider
    )) as number[];
    logAndSaveResults("read_prices", uniqueSignerCount, dataFeeds, gasUsage[0]);

    const timestampGasUsage = await adapter.readTimestampFromContract();
    logAndSaveResults(
      "read_timestamp",
      uniqueSignerCount,
      dataFeeds,
      timestampGasUsage
    );
  }

  function logAndSaveResults(
    method: string,
    uniqueSignerCount: number,
    dataFeeds: string[],
    gasUsage: number
  ) {
    console.log(
      `Gas usage for ${method}, ${uniqueSignerCount} signer(s), ${dataFeeds.length} feed(s): ${gasUsage}`
    );

    results[`${method}:${uniqueSignerCount * dataFeeds.length}`] = gasUsage;
  }
});
