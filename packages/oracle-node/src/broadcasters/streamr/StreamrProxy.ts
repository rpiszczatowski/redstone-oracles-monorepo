import {
  StreamPermission,
  StreamrClient,
  STREAMR_STORAGE_NODE_GERMANY,
} from "streamr-client";
import { providers, utils } from "ethers";
import { Consola } from "consola";
import pako from "pako";

const logger = require("../../utils/logger")("StreamrProxy") as Consola;

const POLYGON_RPC = {
  name: "Polygon",
  rpc: "https://polygon-rpc.com",
  chainId: 137,
};

export class StreamrProxy {
  private streamrClient: StreamrClient;

  constructor(ethPrivateKey: string) {
    this.streamrClient = new StreamrClient({
      auth: { privateKey: ethPrivateKey },
    });
  }

  public async publishToStreamByName(data: any, streamName: string) {
    const streamId = await this.getStreamIdOrCreate(streamName);
    if (streamId) {
      const dataCompressed = this.compressData(data);
      return await this.publish(dataCompressed, streamId);
    }
    throw new Error("Cannot broadcast to Streamr network");
  }

  async getStreamIdOrCreate(name: string) {
    const streamId = await this.getStreamIdForStreamName(name);
    const streamExists = await this.doesStreamExist(streamId);
    if (streamExists) {
      logger.info(`Streamr stream already exists: ${streamId}`);
      return streamId;
    } else {
      logger.info(`Streamr stream ${streamId} doesn't exist`);
      return await this.tryToCreateStream(streamId);
    }
  }

  private async getStreamIdForStreamName(name: string): Promise<string> {
    const publicAddress = await this.streamrClient.getAddress();
    const path = `/redstone-oracle-node/${name}`;
    return `${publicAddress}${path}`;
  }

  private async doesStreamExist(streamId: string): Promise<boolean> {
    logger.info(`Checking if Streamr stream ${streamId} already exists`);
    try {
      await this.streamrClient.getStream(streamId);
      return true;
    } catch (error: any) {
      if (error.toString().includes("NOT_FOUND")) {
        return false;
      } else {
        throw error;
      }
    }
  }

  /* A small amount of MATIC (around 0.03) is needed for gas to create stream */
  private async tryToCreateStream(id: string) {
    logger.info(`Trying to create new Streamr stream ${id}`);
    const publicAddress = await this.streamrClient.getAddress();
    const { isEnoughMatic, balance } = await this.checkIfEnoughMatic(
      publicAddress
    );
    if (!isEnoughMatic) {
      logger.error(
        `Cannot create Streamr stream, not enough MATIC: ${balance}`
      );
      return;
    }
    const stream = await this.streamrClient.createStream({
      id,
      storageDays: 7,
      inactivityThresholdHours: 24 * 20, // 20 days
    });
    logger.info(`Stream created: ${stream.id}`);
    await stream.grantPermissions({
      public: true,
      permissions: [StreamPermission.SUBSCRIBE],
    });
    logger.info(`Added permissions to the stream: ${stream.id}`);

    try {
      await stream.addToStorageNode(STREAMR_STORAGE_NODE_GERMANY);
      logger.info(
        "Stream added to the storage node: STREAMR_STORAGE_NODE_GERMANY"
      );
    } catch (error) {
      logger.error(
        "Adding stream to storage node hit timeout limit. It could be added, please verify it manually. Data will be still broadcasted"
      );
    }

    return stream.id;
  }

  private async checkIfEnoughMatic(address: string) {
    logger.info("Checking MATIC balance");
    const provider = new providers.JsonRpcProvider(POLYGON_RPC.rpc, {
      name: POLYGON_RPC.name,
      chainId: POLYGON_RPC.chainId,
    });
    const balance = await provider.getBalance(address);
    return {
      isEnoughMatic: balance.gte(utils.parseEther("0.1")),
      balance: utils.formatEther(balance),
    };
  }

  public async compressData(data: any) {
    const dataAsString = JSON.stringify(data);
    return pako.deflate(dataAsString);
  }

  private async publish(data: any, streamId: string) {
    await this.streamrClient.publish(streamId, {
      ...data,
    });
    logger.info(`New data published to the stream: ${streamId}`);
  }
}
