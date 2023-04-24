import { exchanges } from "ccxt";
import { CcxtFetcher } from "./CcxtFetcher";
import supportedExchanges from "./all-supported-exchanges.json";

const fetchersObj: { [name: string]: CcxtFetcher } = {};

// Fetcher names must be the same as their exchange names
for (const fetcherName of supportedExchanges) {
  fetchersObj[fetcherName] = new CcxtFetcher(
    fetcherName as keyof typeof exchanges
  );
}

export default fetchersObj;
