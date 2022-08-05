import {
  DataPackage,
  NumericDataPoint,
  SignedDataPackagePlainObj,
} from "redstone-protocol";
import { Consola } from "consola";
import { trackStart, trackEnd } from "../utils/performance-tracker";
import {
  ExtendedSignedDataPackagePlainObj,
  PriceDataAfterAggregation,
} from "../types";

const logger = require("../utils/logger")("ArweaveService") as Consola;

interface PriceSignerConfig {
  version: string;
  evmChainId: number;
  ethereumPrivateKey: string;
}

// Business service that supplies signing operations required by Redstone-Node
export default class PriceSignerService {
  private ethereumPrivateKey: string;

  constructor(config: PriceSignerConfig) {
    this.ethereumPrivateKey = config.ethereumPrivateKey;
  }

  signPrices(
    prices: PriceDataAfterAggregation[]
  ): ExtendedSignedDataPackagePlainObj[] {
    const signingTrackingId = trackStart("signing");
    const signedPrices: ExtendedSignedDataPackagePlainObj[] = [];
    for (const price of prices) {
      logger.info(`Signing price: ${price.id}`);
      const signedPrice = this.signSinglePrice(price);
      signedPrices.push(signedPrice);
    }
    trackEnd(signingTrackingId);
    return signedPrices;
  }

  signSinglePrice(
    price: PriceDataAfterAggregation
  ): ExtendedSignedDataPackagePlainObj {
    logger.info(`Signing price with evm signer: ${price.id}`);
    const { symbol, value, timestamp, ...restParams } = price;
    const dataPoint = new NumericDataPoint({
      symbol,
      value,
    });
    const dataPackage = new DataPackage([dataPoint], timestamp);
    const signedDataPackage = dataPackage.sign(this.ethereumPrivateKey);
    const parsedSignedDataPackage = signedDataPackage.toObj();

    return {
      ...parsedSignedDataPackage,
      ...restParams,
    };
  }

  signPricePackage(
    prices: PriceDataAfterAggregation[]
  ): SignedDataPackagePlainObj {
    const signingTrackingId = trackStart("signing");
    const dataPoints: NumericDataPoint[] = [];

    for (const price of prices) {
      logger.info(`Signing price: ${price.id}`);
      const dataPoint = new NumericDataPoint({
        symbol: price.symbol,
        value: price.value,
      });
      dataPoints.push(dataPoint);
    }
    const { timestamp } = prices[0];
    const dataPackage = new DataPackage(dataPoints, timestamp);
    const signedDataPackage = dataPackage.sign(this.ethereumPrivateKey);
    trackEnd(signingTrackingId);
    const parsedSignedDataPackage = signedDataPackage.toObj();

    return parsedSignedDataPackage;
  }
}
