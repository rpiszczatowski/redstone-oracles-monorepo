import { MultiRequestFetcher } from "../MultiRequestFetcher";
import { PricesObj } from "../../types";

const axios = require("axios");

const DIA_BASE_URL = "https://api.diadata.org/v1";
const DIA_QUOTATION_PATH = "quotation";

interface Response {
  data: Quotation;
}

interface Quotation {
  Symbol: string;
  Price: number;
}

export class DiaFetcher extends MultiRequestFetcher {
  constructor() {
    super("dia");
  }

  makeRequest(id: string): Promise<any> {
    return axios.get(`${DIA_BASE_URL}/${DIA_QUOTATION_PATH}/${id}`);
  }

  processData(response: Response, pricesObj: PricesObj): PricesObj {
    pricesObj[response.data.Symbol] = response.data.Price;

    return pricesObj;
  }
}
