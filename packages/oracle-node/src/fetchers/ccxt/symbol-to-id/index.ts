import { exchanges } from "ccxt";
import supportedExchanges from "../all-supported-exchanges.json";

type Exchanges = keyof typeof exchanges;

type MappingsForCCXT = {
  [exchangeId in keyof typeof exchanges]?: {
    [symbolId: string]: string;
  };
};

const mappings: MappingsForCCXT = {};

for (const exchangeId of supportedExchanges) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  mappings[exchangeId as Exchanges] = require(`./${exchangeId}.json`) as Record<
    string,
    string
  >;
}

export default mappings;
