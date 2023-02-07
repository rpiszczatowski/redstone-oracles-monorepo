import axios from "axios";
import { BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import { PricesObj } from "../../types";
import { parseSymbolWithTradeDetails } from "../../utils/symbols-parser";
import { MultiRequestFetcher2 } from "../MultiRequestFetcher2";

type OneInchResponse = any;

const ONE_INCH_API_URL = "https://api.1inch.io/v5.0/1/quote";

export class OneInchFetcher extends MultiRequestFetcher2 {
  constructor() {
    super("one-inch");
  }

  makeRequest(id: string): Promise<any> {
    const potentialTradeDetails = parseSymbolWithTradeDetails(id);
    const reqParams = potentialTradeDetails.reqParams;
    const oneInchParams = {
      fromTokenAddress: reqParams.sellToken,
      toTokenAddress: reqParams.buyToken,
      amount: reqParams.sellAmount,
    };
    return axios.get(ONE_INCH_API_URL, {
      params: oneInchParams,
    });
  }

  processData(
    oneInchResponse: OneInchResponse,
    pricesObj: PricesObj,
    _context: any,
    id: string
  ): PricesObj {
    const toTokenAmount = formatUnits(
      oneInchResponse.toTokenAmount,
      oneInchResponse.toToken.decimals
    );
    const fromTokenAmount = formatUnits(
      oneInchResponse.fromTokenAmount,
      oneInchResponse.fromToken.decimals
    );

    pricesObj[id] = id.includes("SELL")
      ? Number(toTokenAmount) / Number(fromTokenAmount)
      : Number(fromTokenAmount) / Number(toTokenAmount);
    return pricesObj;
  }
}
