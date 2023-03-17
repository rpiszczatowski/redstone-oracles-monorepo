import { ContractConnector } from "redstone-sdk";
import { WalletLocked, WalletUnlocked } from "fuels";
import axios from "axios";

const FUEL_BASE_GAS_LIMIT = 500000000;

export abstract class FuelContractConnector<Adapter>
  implements ContractConnector<Adapter>
{
  protected constructor(protected wallet: WalletLocked | WalletUnlocked) {}

  abstract getAdapter(): Promise<Adapter>;

  getGasLimit(): number {
    return !!this.wallet.provider.url.indexOf("127.0.0.1")
      ? 0
      : FUEL_BASE_GAS_LIMIT;
  }

  async getBlockNumber(rpcUrl: string): Promise<number> {
    const LATEST_BLOCK_QUERY =
      "query LatestBlockHeight { chain { latestBlock {  header { height } } } }";

    const response = await axios({
      url: rpcUrl,
      method: "POST",
      data: { query: LATEST_BLOCK_QUERY },
    });

    return response.data.data.chain.latestBlock.header.height;
  }
}
