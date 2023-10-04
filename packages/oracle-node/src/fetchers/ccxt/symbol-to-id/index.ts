import { exchanges } from "ccxt";
import * as fs from "fs";
import supportedExchanges from "../all-supported-exchanges.json";

type Exchanges = keyof typeof exchanges;

type MappingsForCCXT = {
  [exchangeId in keyof typeof exchanges]?: {
    [symbolId: string]: string;
  };
};

const mappings: MappingsForCCXT = {};

for (const exchangeId of supportedExchanges) {
  mappings[exchangeId as Exchanges] = JSON.parse(
    fs
      .readFileSync(
        `${process.cwd()}/src/fetchers/ccxt/symbol-to-id/${exchangeId}.json`
      )
      .toString()
  ) as Record<string, string>;
}

export default mappings;
