import {
  DataPackage,
  DataPoint,
  NumericDataPoint,
  SignedDataPackage,
} from "@redstone-finance/protocol";
import {
  DataPackageBroadcaster,
  HttpBroadcaster,
  StreamrBroadcaster,
} from "../broadcasters";
import { config } from "../config";
import { createMetadataForRedstonePrice } from "../fetchers/MetadataForRedstonePrice";
import ManifestHelper from "../manifest/ManifestHelper";
import { IterationContext } from "../schedulers/IScheduler";
import { PriceDataAfterAggregation } from "../types";
import loggerFactory from "../utils/logger";
import { validateDataPointsForBigPackage } from "../validators/validate-data-feed-for-big-package";
import PricesService from "./../fetchers/PricesService";
import { AggregatedPriceHandler } from "./AggregatedPriceHandler";
import { BroadcastPerformer } from "./BroadcastPerformer";
import { ManifestDataProvider } from "./ManifestDataProvider";

const logger = loggerFactory("runner");

const DEFAULT_HTTP_BROADCASTER_URLS = [
  "https://direct-1.cache-service.redstone.finance",
  "https://direct-2.cache-service.redstone.finance",
  "https://direct-3.cache-service.redstone.finance",
];

export class DataPackageBroadcastPerformer
  extends BroadcastPerformer
  implements AggregatedPriceHandler
{
  private readonly httpBroadcaster: DataPackageBroadcaster;
  private readonly streamrBroadcaster: DataPackageBroadcaster;

  constructor(
    broadcasterURLs: string[] | undefined,
    private readonly manifestDataProvider: ManifestDataProvider
  ) {
    super();
    this.httpBroadcaster = new HttpBroadcaster(
      broadcasterURLs ?? DEFAULT_HTTP_BROADCASTER_URLS,
      config.safeSigner
    );

    this.streamrBroadcaster = new StreamrBroadcaster(config.safeSigner);
  }

  async handle(
    aggregatedPrices: PriceDataAfterAggregation[],
    pricesService: PricesService,
    iterationContext: IterationContext
  ): Promise<void> {
    // Signing
    const signedDataPackages = this.signPrices(
      pricesService,
      aggregatedPrices,
      iterationContext
    );

    // Broadcasting
    await this.broadcastDataPackages(signedDataPackages);
  }

  private signPrices(
    pricesService: PricesService,
    prices: PriceDataAfterAggregation[],
    iterationContext: IterationContext
  ): SignedDataPackage[] {
    // Prepare data points
    const dataPoints: DataPoint[] = [];
    for (const price of prices) {
      try {
        const dataPoint = this.priceToDataPoint(price);
        dataPoints.push(dataPoint);
      } catch (e) {
        logger.error(
          `Failed to convert price object to data point for ${
            price.symbol
          } (${String(price.value)})`
        );
      }
    }

    const useBlockNumbers =
      this.manifestDataProvider.latestManifest!
        .signBlockNumbersInsteadOfTimestamps;
    if (useBlockNumbers && !iterationContext.blockNumber) {
      throw new Error("Can not sign empty block number");
    }
    const timeIdentifierForSigning = useBlockNumbers
      ? iterationContext.blockNumber!
      : iterationContext.timestamp;

    // Prepare signed data packages with single data point
    const signedDataPackages = dataPoints.map((dataPoint) => {
      const dataPackage = new DataPackage(
        [dataPoint],
        timeIdentifierForSigning
      );

      return new SignedDataPackage(
        dataPackage,
        config.safeSigner.signDigest(dataPackage.getSignableHash())
      );
    });

    const dataPointsForBigPackage =
      pricesService.filterDataPointsForBigPackage(dataPoints);

    // Adding a data package with all data points
    const areEnoughDataPoint = validateDataPointsForBigPackage(
      dataPointsForBigPackage,
      this.manifestDataProvider.allTokensConfig
    );
    if (areEnoughDataPoint) {
      const bigDataPackage = new DataPackage(
        dataPointsForBigPackage,
        timeIdentifierForSigning
      );
      const signableHashBytes = bigDataPackage.getSignableHash();

      const signedBigDataPackage = new SignedDataPackage(
        bigDataPackage,
        config.safeSigner.signDigest(signableHashBytes)
      );
      signedDataPackages.push(signedBigDataPackage);
    }

    return signedDataPackages;
  }

  public async broadcastDataPackages(signedDataPackages: SignedDataPackage[]) {
    const promises = [];
    promises.push(this.httpBroadcaster.broadcast(signedDataPackages));
    if (config.enableStreamrBroadcasting) {
      promises.push(this.streamrBroadcaster.broadcast(signedDataPackages));
    }

    await this.performBroadcast(promises, "data package");
  }

  private priceToDataPoint(price: PriceDataAfterAggregation): NumericDataPoint {
    return new NumericDataPoint({
      dataFeedId: price.symbol,
      value: price.value.unsafeToNumber(),
      decimals: ManifestHelper.getDataFeedDecimals(
        this.manifestDataProvider.latestManifest!,
        price.symbol
      ),
      metadata: createMetadataForRedstonePrice(price),
    });
  }
}
