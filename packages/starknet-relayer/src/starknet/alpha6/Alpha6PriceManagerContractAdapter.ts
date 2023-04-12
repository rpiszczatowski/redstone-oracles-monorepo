import { Contract } from "starknet";
import { FEE_MULTIPLIER } from "@redstone-finance/starknet-connector";
import {
  IPriceManagerContractAdapter,
  getNumberFromStarknet,
} from "../IPriceManagerContractAdapter";
import { Alpha6ContractParamsProvider } from "./Alpha6ContractParamsProvider";

export class Alpha6PriceManagerContractAdapter
  implements IPriceManagerContractAdapter
{
  constructor(
    private readonly contract: Contract,
    private readonly paramsProvider: Alpha6ContractParamsProvider,
    private readonly maxEthFee: number = 0.004
  ) {}

  async readTimestampAndRound(): Promise<any> {
    const result = (await this.contract.call("read_round_data")).undefined;

    return {
      payload_timestamp: getNumberFromStarknet(result.payload_timestamp) * 1000,
      round: getNumberFromStarknet(result.round),
      block_number: getNumberFromStarknet(result.block_number),
      block_timestamp: getNumberFromStarknet(result.block_timestamp) * 1000,
    };
  }

  async writePrices(round: number): Promise<string> {
    const payloadData =
      await this.paramsProvider.getAggregatedPriceValuesAndTimestamp();

    return (
      await this.contract.invoke(
        "write_prices",
        [
          round,
          this.paramsProvider.getHexlifiedFeedIds(),
          payloadData.priceValues,
          payloadData.timestamp,
        ],
        { maxFee: this.maxEthFee * FEE_MULTIPLIER, parseRequest: true }
      )
    ).transaction_hash;
  }
}
