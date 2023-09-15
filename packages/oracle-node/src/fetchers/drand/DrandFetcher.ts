import axios, { AxiosResponse } from "axios";
import { PricesObj } from "../../types";
import { BaseFetcher } from "../BaseFetcher";

const DRAND_URL = "https://drand.cloudflare.com/public/latest";
const MAX_ENTROPY_VALUE = 10000000;
export const ENTROPY_SYMBOL = "ENTROPY";

type DrandResponse = {
  round: number;
  randomness: string;
  signature: string;
  previours_signature: string;
};

export class DrandFetcher extends BaseFetcher {
  constructor() {
    super("drand");
  }

  override async fetchData() {
    return await axios.get<DrandResponse>(DRAND_URL);
  }

  override extractPrices(
    response: AxiosResponse<DrandResponse>,
    symbols: string[]
  ): PricesObj {
    if (symbols.length !== 1 || symbols[0] !== ENTROPY_SYMBOL) {
      throw new Error(`Only one symbol supported by drand: ${ENTROPY_SYMBOL}`);
    }

    const entropy = JSON.parse(
      Number(
        BigInt("0x" + response.data.randomness) % BigInt(MAX_ENTROPY_VALUE)
      ).toString()
    ) as string;

    const result = {
      [ENTROPY_SYMBOL]: entropy,
    };

    return result;
  }
}
