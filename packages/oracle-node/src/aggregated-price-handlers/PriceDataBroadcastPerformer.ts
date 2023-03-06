import { AggregatedPriceHandler } from "./AggregatedPriceHandler";
import { PriceDataBroadcaster } from "../broadcasters";
import { PriceDataAfterAggregation, PriceDataSigned } from "../types";
import PricesService from "../fetchers/PricesService";
import { BroadcastPerformer } from "./BroadcastPerformer";
import PriceSignerService from "../signers/PriceSignerService";
import { config } from "../config";

const DEFAULT_PRICE_BROADCASTER_URLS = [
  "https://api.redstone.finance",
  "https://vwx3eni8c7.eu-west-1.awsapprunner.com",
  "https://container-service-1.dv9sai71f4rsq.eu-central-1.cs.amazonlightsail.com",
];

export class PriceDataBroadcastPerformer
  extends BroadcastPerformer
  implements AggregatedPriceHandler
{
  private readonly priceBroadcaster: PriceDataBroadcaster;
  private readonly priceSignerService: PriceSignerService;

  constructor(
    broadcasterURLs: string[] | undefined,
    ethereumPrivateKey: string,
    private readonly providerAddress: string
  ) {
    super();
    this.priceBroadcaster = new PriceDataBroadcaster(
      broadcasterURLs ?? DEFAULT_PRICE_BROADCASTER_URLS
    );
    this.priceSignerService = new PriceSignerService(ethereumPrivateKey);
  }

  async handle(
    aggregatedPrices: PriceDataAfterAggregation[],
    pricesService: PricesService
  ): Promise<void> {
    const pricesReadyForSigning = pricesService.preparePricesForSigning(
      aggregatedPrices,
      "",
      config.providerIdForPriceBroadcasting || this.providerAddress
    );

    // Signing
    const signedPrices: PriceDataSigned[] =
      await this.priceSignerService.signPrices(pricesReadyForSigning);

    await this.broadcastPrices(signedPrices);
  }

  private async broadcastPrices(signedPrices: PriceDataSigned[]) {
    await this.performBroadcast(
      [this.priceBroadcaster.broadcast(signedPrices)],
      "price data"
    );
  }
}
