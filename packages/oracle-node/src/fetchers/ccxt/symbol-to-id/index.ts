import { exchanges } from "ccxt";
import supportedExchanges from "../all-supported-exchanges.json";

type Exchanges = keyof typeof exchanges;

type MappingsForCCXT = Partial<{
  [exchangeId in keyof typeof exchanges]: {
    [symbolId in string]: string;
  };
}>;

const mappings: MappingsForCCXT = {};

for (const exchangeId of supportedExchanges) {
  mappings[exchangeId as Exchanges] = require(`./${exchangeId}.json`);
}

export default mappings;
