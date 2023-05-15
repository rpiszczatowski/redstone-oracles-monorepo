import { OpenedContract, TonClient, WalletContractV4 } from "ton";
import { Sender } from "ton-core";
import { mnemonicToWalletKey } from "ton-crypto";
import { config } from "./config";
import { getHttpEndpoint } from "@orbs-network/ton-access";

export abstract class Ton {
  walletContract?: OpenedContract<WalletContractV4>;
  walletSender?: Sender;
  client?: TonClient;

  abstract perform(): Promise<any>;

  async connect(): Promise<Ton> {
    const key = await mnemonicToWalletKey(config.mnemonic);
    const wallet = WalletContractV4.create({
      publicKey: key.publicKey,
      workchain: 0,
    });

    // initialize ton rpc client on testnet
    const endpoint = await getHttpEndpoint({ network: "testnet" });
    this.client = new TonClient({ endpoint });

    this.walletContract = this.client.open(wallet);
    this.walletSender = this.walletContract.sender(key.secretKey);

    // make sure wallet is deployed
    if (!(await this.client.isContractDeployed(wallet.address))) {
      throw "wallet is not deployed";
    }

    return this;
  }

  async wait(callback: () => void): Promise<void> {
    const seqno = await this.walletContract!.getSeqno();

    await callback();

    // wait until confirmed
    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
      console.log("waiting for transaction to confirm...");
      await this.sleep(1500);
      currentSeqno = await this.walletContract!.getSeqno();
    }

    console.log("transaction confirmed!");
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
