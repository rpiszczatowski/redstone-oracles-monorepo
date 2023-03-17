import {
  FuelPricesContractAdapter,
  FuelPricesContractConnector,
} from "../../src";
import { InvocationResult } from "fuels";
import { PricesContractAdapter } from "redstone-sdk";

export class GasUsageFuelPricesContractConnector extends FuelPricesContractConnector {
  async getAdapter(): Promise<PricesContractAdapter> {
    return new GasUsageFuelPricesContractAdapter(
      await this.getContract(),
      this.getGasLimit()
    );
  }
}

class GasUsageFuelPricesContractAdapter extends FuelPricesContractAdapter {
  protected extractNumbers(result: InvocationResult): number[] {
    return [result.gasUsed.toNumber()];
  }

  async readTimestampFromContract(): Promise<number> {
    return (
      await this.contract.functions.read_timestamp().get()
    ).gasUsed.toNumber();
  }
}
