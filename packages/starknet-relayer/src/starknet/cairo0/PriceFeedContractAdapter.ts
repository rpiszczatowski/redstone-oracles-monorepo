import { Contract } from "starknet";

export class PriceFeedContractAdapter {
  constructor(private readonly contract: Contract) {}

  async readLatestRoundData(): Promise<any> {
    return (await this.contract.call("latest_round_data"))[0];
  }
}
