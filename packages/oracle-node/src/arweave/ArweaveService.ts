import axios, { AxiosResponse } from "axios";
import { Manifest } from "../types";
import { promiseTimeout } from "../utils/promise-timeout";
import { getDataServiceIdForSigner } from "@redstone-finance/sdk";
import { config } from "../config";
import contractsAddresses from "../../src/config/contracts.json";
import loggerFactory from "../utils/logger";
import {
  GetDetailsByIdInput,
  RedstoneOraclesState,
} from "@redstone-finance/oracles-smartweave-contracts";

const logger = loggerFactory("ArweaveService");

const ARWEAVE_URL = "https://arweave.net";
const WARP_DRE_NODE_URL = "https://dre-1.warp.cc/contract";
const TIMEOUT_MS = 10 * 1000;

export default class ArweaveService {
  constructor(private readonly timeout: number = TIMEOUT_MS) {}

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  private async fetchManifestPromise(manifestTxId: string) {
    const response = await axios.get(`${ARWEAVE_URL}/${manifestTxId}`);
    const parsedManifest = (response as AxiosResponse<Manifest>).data;
    parsedManifest.txId = manifestTxId;
    return parsedManifest;
  }

  async getCurrentManifest(oldManifest?: Manifest): Promise<Manifest> {
    try {
      const oracleRegistryState = await this.getOracleRegistryState();
      const dataServiceId = getDataServiceIdForSigner(
        oracleRegistryState,
        config.ethereumAddress
      );
      const manifestTxId =
        oracleRegistryState.dataServices[dataServiceId].manifestTxId;
      if (!manifestTxId) {
        throw new Error(
          "Cannot fetch new manifest, no manifest transaction id provided"
        );
      }
      return await promiseTimeout(
        () => this.fetchManifestPromise(manifestTxId),
        this.timeout
      );
    } catch (error) {
      if (oldManifest) {
        return oldManifest;
      } else {
        logger.error((error as Error).stack);
        throw new Error(
          "Cannot fetch new manifest and old manifest doesn't exist"
        );
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  async getOracleRegistryState(): Promise<RedstoneOraclesState> {
    const params = new URLSearchParams([
      ["id", contractsAddresses["oracle-registry"]],
    ]);
    const response = await axios.get<GetDetailsByIdInput>(WARP_DRE_NODE_URL, {
      params,
    });
    return response.data.state;
  }
}
