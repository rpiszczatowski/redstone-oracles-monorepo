import axios from "axios";
import { PricesObj } from "../../types";
import { parseSymbolWithTradeDetails } from "../../utils/symbols-parser";
import { MultiRequestFetcher2 } from "../MultiRequestFetcher2";

type ZeroExResponse = any;

const ZERO_EX_API_URL = "https://api.0x.org/swap/v1/quote";

export class ZeroExFetcher extends MultiRequestFetcher2 {
  constructor() {
    super("zero-ex");
  }

  makeRequest(id: string): Promise<any> {
    const potentialTradeDetails = parseSymbolWithTradeDetails(id);
    return axios.get(ZERO_EX_API_URL, {
      params: potentialTradeDetails.reqParams,
    });
  }

  processData(
    zeroExResponse: ZeroExResponse,
    pricesObj: PricesObj,
    _context: any,
    id: string
  ): PricesObj {
    pricesObj[id] = zeroExResponse.price;
    return pricesObj;
  }
}
