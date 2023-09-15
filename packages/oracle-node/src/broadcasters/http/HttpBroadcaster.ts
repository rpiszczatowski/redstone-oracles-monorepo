import axios from "axios";
import { SignedDataPackage, UniversalSigner } from "@redstone-finance/protocol";
import { stringifyError } from "../../utils/error-stringifier";
import { DataPackageBroadcaster } from "../DataPackageBroadcaster";
import loggerFactory from "../../utils/logger";

const logger = loggerFactory("HttpBroadcaster");

export class HttpBroadcaster implements DataPackageBroadcaster {
  constructor(
    private readonly broadcasterURLs: string[],
    private readonly ethereumPrivateKey: string
  ) {}

  async broadcast(dataPackages: SignedDataPackage[]): Promise<void> {
    const dataPackagesObjects = dataPackages.map((dp) => dp.toObj());
    const requestSignature = UniversalSigner.signStringifiableData(
      dataPackagesObjects,
      this.ethereumPrivateKey
    );

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
          logger.error(`Broadcasting to ${url} failed: ${stringifyError(e)}`)
        );
    });

    await Promise.allSettled(promises);
  }
}
