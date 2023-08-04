import { SendMode, TonClient4 } from "ton";
import { Cell, ContractProvider } from "ton-core";
import { Maybe } from "ton/dist/utils/maybe";
import { NetworkProvider } from "@ton-community/blueprint";

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export abstract class TonConnector {
  networkProvider!: NetworkProvider;

  async connect(networkProvider: NetworkProvider): Promise<TonConnector> {
    this.networkProvider = networkProvider;

    // make sure wallet is deployed
    const walletAddress = this.networkProvider.sender().address;
    if (
      !walletAddress ||
      !(await networkProvider.isContractDeployed(walletAddress))
    ) {
      throw "wallet is not deployed";
    }

    return this;
  }

  async internalMessage(
    provider: ContractProvider,
    coins: number,
    body?: Maybe<Cell | string>
  ): Promise<void> {
    await this.wait(() => {
      provider.internal(this.networkProvider.sender(), {
        value: `${coins}`,
        body,
        sendMode: SendMode.PAY_GAS_SEPARATELY,
      });
    });
  }

  private async wait(callback: () => void): Promise<void> {
    const seqno = (await this.networkProvider.api().getLastBlock()).last.seqno;

    await callback();

    // wait until confirmed
    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
      console.log("waiting for transaction to confirm...");
      await sleep(1500);
      currentSeqno = (await this.networkProvider.api().getLastBlock()).last
        .seqno;
    }

    console.log("transaction confirmed!");
  }
}
