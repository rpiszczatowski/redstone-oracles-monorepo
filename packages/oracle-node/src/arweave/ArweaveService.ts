import axios, { AxiosResponse } from "axios";
import { Consola } from "consola";
import { Manifest } from "../types";
import { promiseTimeout } from "../utils/promise-timeout";
import { getDataServiceIdForSigner } from "@redstone-finance/sdk";
import { config } from "../config";
import contractsAddresses from "../../src/config/contracts.json";

const logger = require("../utils/logger")("ArweaveService") as Consola;

const ARWEAVE_URL = "https://arweave.net";
const WARP_DRE_NODE_URL = "https://dre-1.warp.cc/contract";
const TIMEOUT_MS = 10 * 1000;

export default class ArweaveService {
  constructor(private readonly timeout: number = TIMEOUT_MS) {}

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
      return await promiseTimeout(
        () => this.fetchManifestPromise(manifestTxId),
        this.timeout
      );
    } catch (error: any) {
      if (oldManifest) {
        return oldManifest;
      } else {
        logger.error(error.stack);
        throw new Error(
          "Cannot fetch new manifest and old manifest doesn't exist"
        );
      }
    }
  }

  async getOracleRegistryState() {
    const params = new URLSearchParams([
      ["id", contractsAddresses["oracle-registry"]],
    ]);
    const response = await axios.get(WARP_DRE_NODE_URL, {
      params,
    });
    return response.data.state;
  }
}
