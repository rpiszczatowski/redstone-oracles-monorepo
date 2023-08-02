import { OpenedContract, TonClient, TonClient4, WalletContractV4 } from "ton";
import { Cell, ContractProvider, Sender } from "ton-core";
import { mnemonicToWalletKey } from "ton-crypto";
import { config } from "./config";
import { Maybe } from "ton/dist/utils/maybe";
import { NetworkProvider } from "@ton-community/blueprint";

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export abstract class TonConnector {
  walletContract?: OpenedContract<WalletContractV4>;
  walletSender?: Sender;
  client?: TonClient4;

  async connect(networkProvider: NetworkProvider): Promise<TonConnector> {
    const key = await mnemonicToWalletKey(config.mnemonic);
    const wallet = WalletContractV4.create({
      publicKey: key.publicKey,
      workchain: 0,
    });

    this.client = networkProvider.api();

    this.walletContract = this.client.open(wallet);
    this.walletSender = networkProvider.sender();

    // make sure wallet is deployed
    if (
      !this.walletSender.address ||
      !(await networkProvider.isContractDeployed(this.walletSender.address))
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
      provider.internal(this.walletSender!, {
        value: `${coins}`,
        body,
      });
    });
  }

  private async wait(callback: () => void): Promise<void> {
    const seqno = await this.walletContract!.getSeqno();

    await callback();

    // wait until confirmed
    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
      console.log("waiting for transaction to confirm...");
      await sleep(1500);
      currentSeqno = await this.walletContract!.getSeqno();
    }

    console.log("transaction confirmed!");
  }
}
