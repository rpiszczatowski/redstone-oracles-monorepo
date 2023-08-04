import { SendMode, TonClient4 } from "ton";
import { Cell, ContractProvider, Sender } from "ton-core";
import { Maybe } from "ton/dist/utils/maybe";
import { NetworkProvider } from "@ton-community/blueprint";

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export abstract class TonConnector {
  sender!: Sender;
  api?: TonClient4;

  async connect(networkProvider: NetworkProvider): Promise<TonConnector> {
    this.sender = networkProvider.sender();
    this.api = networkProvider.api();

    const walletAddress = this.sender.address;
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
    body?: Cell,
    sendMode = SendMode.PAY_GAS_SEPARATELY
  ): Promise<void> {
    await this.wait(async () => {
      await provider.internal(this.sender, {
        value: `${coins}`,
        body,
        sendMode,
      });
    });
  }

  private async wait(callback: () => Promise<void>): Promise<void> {
    if (!this.api) {
      await callback();

      return;
    }

    const seqno = (await this.api.getLastBlock()).last.seqno;

    await callback();

    // wait until confirmed
    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
      console.log("waiting for transaction to confirm...");
      await sleep(1500);
      currentSeqno = (await this.api.getLastBlock()).last.seqno;
    }

    console.log("transaction confirmed!");
  }
}
