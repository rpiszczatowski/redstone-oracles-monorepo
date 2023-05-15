import {
  Address,
  Contract,
  OpenedContract,
  Sender,
  TonClient,
  TonClient4,
  WalletContractV4,
} from "ton";
import { KeyPair } from "ton-crypto/dist/primitives/nacl";
import assert from "assert";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { TonNetwork } from "./TonNetwork";

export class CustomTonNetwork implements TonNetwork {
  api?: TonClient4;
  oldApi?: TonClient;
  sender?: Sender;
  workchain = 0;
  walletContract?: OpenedContract<WalletContractV4>;

  constructor(
    private walletKeyProvider: () => KeyPair | undefined,
    private apiV2Config: { apiEndpoint: string; apiKey?: string }
  ) {}

  async setUp() {
    const walletKey = this.walletKeyProvider();

    assert(walletKey, "Wallet key is undefined!");

    const endpoint = await getHttpV4Endpoint({ network: "testnet" });

    const wallet = WalletContractV4.create({
      publicKey: walletKey.publicKey,
      workchain: 0,
    });

    this.api = new TonClient4({ endpoint });
    this.oldApi = new TonClient({
      endpoint: this.apiV2Config.apiEndpoint,
      apiKey: this.apiV2Config.apiKey,
    });

    this.walletContract = this.oldApi.open(wallet);
    this.sender = this.walletContract.sender(walletKey.secretKey);
  }

  async isContractDeployed(address?: Address): Promise<boolean> {
    const seqno = await this.walletContract!.getSeqno();

    return address == undefined || this.api!.isContractDeployed(seqno, address);
  }

  open<T extends Contract>(contract: T): OpenedContract<T> {
    return this.api!.open(contract);
  }
}
