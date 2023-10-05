import { SignedDataPackage } from "@redstone-finance/protocol";
import {
  compressMsg,
  doesStreamExist,
  getStreamIdForNodeByEvmAddress,
  StreamPermission,
  StreamrClient,
} from "@redstone-finance/streamr-proxy";
import { providers, utils } from "ethers";
import { ISafeSigner } from "../../signers/SafeSigner";
import loggerFactory from "../../utils/logger";
import { DataPackageBroadcaster } from "../DataPackageBroadcaster";

const POLYGON_RPC = {
  name: "Polygon",
  rpc: "https://polygon-rpc.com",
  chainId: 137,
};
const MINIMAL_MATIC_BALANCE = "0.1";
const STORAGE_DAYS = 7;
const INACTIVITY_THRESHOLD_HOURS = 24 * 20; // 20 days

const logger = loggerFactory("StreamrBroadcaster");

export class StreamrBroadcaster implements DataPackageBroadcaster {
  private readonly streamrClient: StreamrClient;
  private readonly streamId: string;
  private readonly address: string;
  private streamExistsCached: boolean = false;
  private isStreamCreationRequested: boolean = false;

  constructor(safeSigner: ISafeSigner) {
    this.streamrClient = new StreamrClient({
      // FIXME: very unsafe this method should be removed
      auth: { privateKey: safeSigner.veryUnsafeGetPrivateKey(), ethereum: {} },
      network: {
        webrtcDisallowPrivateAddresses: false,
      },
    });
    this.address = safeSigner.address;
    this.streamId = getStreamIdForNodeByEvmAddress(this.address);
  }

  async broadcast(dataPackages: SignedDataPackage[]): Promise<void> {
    const dataToBroadcast = dataPackages.map((dp) => dp.toObj());
    const streamExists = await this.lazyCheckIfStreamExists();
    if (streamExists) {
      logger.info("Broadcasting data packages to streamr");
      await this.streamrClient.publish(
        {
          streamId: this.streamId,
        },
        compressMsg(dataToBroadcast)
      );
      logger.info(`New data published to the stream: ${this.streamId}`);
    } else {
      await this.tryToCreateStream();
    }
  }

  private async tryToCreateStream() {
    if (this.isStreamCreationRequested) {
      logger.info("Stream creation already requested, skipping");
      return;
    }

    logger.info(`Trying to create new Streamr stream: ${this.streamId}`);

    await this.assertEnoughMaticBalance();

    // Creating a stream
    const stream = await this.streamrClient.createStream({
      id: this.streamId,
      storageDays: STORAGE_DAYS,
      inactivityThresholdHours: INACTIVITY_THRESHOLD_HOURS,
    });
    this.isStreamCreationRequested = true;
    logger.info(`Stream created: ${this.streamId}`);

    // Adding permissions
    await stream.grantPermissions({
      public: true,
      permissions: [StreamPermission.SUBSCRIBE],
    });
    logger.info(`Added permissions to the stream: ${stream.id}`);
  }

  private async lazyCheckIfStreamExists() {
    if (this.streamExistsCached) {
      return true;
    }
    return await doesStreamExist(this.streamrClient, this.streamId);
  }

  private async assertEnoughMaticBalance() {
    logger.info("Checking MATIC balance");
    const provider = new providers.JsonRpcProvider(POLYGON_RPC.rpc, {
      name: POLYGON_RPC.name,
      chainId: POLYGON_RPC.chainId,
    });
    const balance = await provider.getBalance(this.address);

    if (!balance.gte(utils.parseEther(MINIMAL_MATIC_BALANCE))) {
      throw new Error(
        `MATIC balance is too low for creating a new stream: ${utils.formatEther(
          balance
        )}`
      );
    }
  }
}
