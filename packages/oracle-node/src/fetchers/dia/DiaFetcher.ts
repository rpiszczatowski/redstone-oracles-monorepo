const axios = require("axios");

import { PricesObj } from "../../types";
import { BaseFetcher } from "../BaseFetcher";

const DIA_BASE_URL = "https://api.diadata.org/v1";
const DIA_QUOTATION_PATH = "quotation";

interface Quotation {
  Symbol: string;
  Price: number;
}

export class DiaFetcher extends BaseFetcher {
  constructor() {
    super("dia");
  }

  async fetchData(ids: string[]): Promise<any> {
    return await Promise.allSettled(ids.map(this.getQuotationResponse));
  }

  async extractPrices(responses: any): Promise<PricesObj> {
    const result: PricesObj = {};

    for (const response of responses) {
      if (response.status === "rejected") {
        continue;
      }

      const quotation = response.value.data as Quotation;

      if (quotation === undefined) {
        continue;
      }

      result[quotation.Symbol] = quotation.Price;
    }

    return result;
  }

  private async getQuotationResponse(id: string): Promise<any> {
    return await axios.get(`${DIA_BASE_URL}/${DIA_QUOTATION_PATH}/${id}`);
  }
}
