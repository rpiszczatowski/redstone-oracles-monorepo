import _ from "lodash";
import EvmPriceSigner from "./EvmPriceSigner";
import {
  PriceDataBeforeSigning,
  PriceDataSigned,
  SignedPricePackage,
} from "../types";
import { trackStart, trackEnd } from "../utils/performance-tracker";
import loggerFactory from "../utils/logger";
import { ISafeSigner } from "./SafeSigner";

const logger = loggerFactory("ArweaveService");

// Business service that supplies signing operations required by Redstone-Node
export default class PriceSignerService {
  private evmSigner: EvmPriceSigner;
  constructor(private readonly safeSigner: ISafeSigner) {
    this.evmSigner = new EvmPriceSigner();
  }

  async signPrices(
    prices: PriceDataBeforeSigning[]
  ): Promise<PriceDataSigned[]> {
    const signingTrackingId = trackStart("signing");
    const signedPrices: PriceDataSigned[] = [];

    try {
      for (const price of prices) {
        logger.info(`Signing price: ${price.id}`);
        const signedPrice = await this.signSinglePrice(price);
        signedPrices.push(signedPrice);
      }
      return signedPrices;
    } finally {
      trackEnd(signingTrackingId);
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async signSinglePrice(
    price: PriceDataBeforeSigning
  ): Promise<PriceDataSigned> {
    logger.info(`Signing price with evm signer: ${price.id}`);
    const packageWithSinglePrice = this.evmSigner.signPricePackage(
      {
        prices: [{ symbol: price.symbol, value: price.value }],
        timestamp: price.timestamp,
      },
      this.safeSigner
    );

    return {
      ...price,
      // evmSignature: packageWithSinglePrice.signature,
      liteEvmSignature: packageWithSinglePrice.liteSignature,
    };
  }

  private signPricePackage(prices: PriceDataSigned[]): SignedPricePackage {
    if (prices.length === 0) {
      throw new Error("Price package should contain at least one price");
    }

    const pricePackage = {
      timestamp: prices[0].timestamp,
      prices: prices.map((p) => ({
        symbol: p.symbol,
        value: p.value,
      })),
    };

    return this.evmSigner.signPricePackage(pricePackage, this.safeSigner);
  }
}
