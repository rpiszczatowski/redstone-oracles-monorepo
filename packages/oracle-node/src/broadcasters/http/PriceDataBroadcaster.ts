import axios from "axios";
import { PriceDataSigned, SignedPricePackage } from "../../types";
import { RedstoneCommon } from "@redstone-finance/utils";
import loggerFactory from "../../utils/logger";

const logger = loggerFactory("PriceDataBroadcaster");

// TODO: add timeout to broadcasting

export class PriceDataBroadcaster {
  constructor(private readonly broadcasterURLs: string[]) {}

  async broadcast(prices: PriceDataSigned[]): Promise<void> {
    const promises = this.broadcasterURLs.map((url) => {
      logger.info(`Posting prices to ${url}`);
      return axios
        .post(
          url + "/prices",
          prices.map((p) => ({ ...p, permawebTx: "mock-permaweb-tx" }))
        )
        .then(() => logger.info(`Broadcasting to ${url} completed`))
        .catch((e) =>
          logger.error(
            `Broadcasting to ${url} failed: ${RedstoneCommon.stringifyError(e)}`
          )
        );
    });

    await Promise.allSettled(promises);
  }

  async broadcastPricePackage(
    signedData: SignedPricePackage,
    providerAddress: string
  ): Promise<void> {
    const body = {
      signerAddress: signedData.signerAddress,
      liteSignature: signedData.liteSignature,
      provider: providerAddress,
      ...signedData.pricePackage, // unpacking prices and timestamp
    };

    const promises = this.broadcasterURLs.map((url) => {
      logger.info(`Posting pacakages to ${url}`);
      return axios
        .post(url + "/packages", body)
        .then(() => logger.info(`Broadcasting package to ${url} completed`))
        .catch((e) =>
          logger.error(
            `Broadcasting package to ${url} failed: ${RedstoneCommon.stringifyError(
              e
            )}`
          )
        );
    });

    await Promise.allSettled(promises);
  }
}
