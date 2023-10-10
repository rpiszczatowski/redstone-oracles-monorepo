import { SignedDataPackage } from "@redstone-finance/protocol";
import { RedstoneCommon } from "@redstone-finance/utils";
import axios from "axios";
import { ISafeSigner } from "../../signers/SafeSigner";
import loggerFactory from "../../utils/logger";
import { DataPackageBroadcaster } from "../DataPackageBroadcaster";

const logger = loggerFactory("HttpBroadcaster");

export class HttpBroadcaster implements DataPackageBroadcaster {
  constructor(
    private readonly broadcasterURLs: string[],
    private readonly safeSigner: ISafeSigner
  ) {}

  async broadcast(dataPackages: SignedDataPackage[]): Promise<void> {
    const dataPackagesObjects = dataPackages.map((dp) => dp.toObj());
    const requestSignature =
      this.safeSigner.signStringifiableData(dataPackagesObjects);

    const signedDataPackagesPostReqBody = {
      requestSignature,
      dataPackages: dataPackagesObjects,
    };

    const promises = this.broadcasterURLs.map((url) => {
      logger.info(`Posting prices to ${url}`);
      return axios
        .post(url + "/data-packages/bulk", signedDataPackagesPostReqBody)
        .then(() => logger.info(`Broadcasting to ${url} completed`))
        .catch((e) =>
          logger.error(
            `Broadcasting to ${url} failed: ${RedstoneCommon.stringifyError(e)}`
          )
        );
    });

    await Promise.allSettled(promises);
  }
}
