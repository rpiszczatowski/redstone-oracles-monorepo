import _ from "lodash";
import { Broadcaster } from "../Broadcaster";
import { PriceDataSigned, SignedPricePackage } from "../../types";
import { Consola } from "consola";
import { StreamrProxy } from "./StreamrProxy";

// TODO: implement streams existence checking

const logger = require("../../utils/logger")("StreamrBroadcaster") as Consola;

const PACKAGE_STREAM_NAME = "package";
const PRICES_STREAM_NAME = "prices";

export class StreamrBroadcaster implements Broadcaster {
  private streamrProxy: StreamrProxy;

  constructor(ethereumPrivateKey: string) {
    this.streamrProxy = new StreamrProxy(ethereumPrivateKey);
  }

  async broadcast(prices: PriceDataSigned[]): Promise<void> {
    const dataToBroadcast = prices.map((p) => _.omit(p, ["source"]));
    const streamName = PRICES_STREAM_NAME;
    logger.info("Broadcasting prices to streamr");
    await this.streamrProxy.publishToStreamByName(dataToBroadcast, streamName);
  }

  async broadcastPricePackage(
    signedData: SignedPricePackage,
    _providerAddress: string
  ): Promise<void> {
    const streamName = PACKAGE_STREAM_NAME;
    await this.streamrProxy.publishToStreamByName(signedData, streamName);
  }
}
