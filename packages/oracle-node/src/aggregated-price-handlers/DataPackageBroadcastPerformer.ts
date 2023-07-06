import { AggregatedPriceHandler } from "./AggregatedPriceHandler";
import { PriceDataAfterAggregation } from "../types";
import PricesService from "./../fetchers/PricesService";
import {
  DataPackage,
  DataPoint,
  NumericDataPoint,
  SignedDataPackage,
} from "redstone-protocol";
import { Consola } from "consola";
import {
  DataPackageBroadcaster,
  HttpBroadcaster,
  StreamrBroadcaster,
} from "../broadcasters";
import { config } from "../config";
import ManifestHelper from "../manifest/ManifestHelper";
import { value } from "jsonpath";
import { DEFAULT_NUM_VALUE_DECIMALS } from "redstone-protocol/src/common/redstone-constants";
import { convertNumberToBytes } from "redstone-protocol/src/common/utils";
import { createMetadataForRedstonePrice } from "../fetchers/MetadataForRedstonePrice";
import { IterationContext } from "../schedulers/IScheduler";
import { validateDataPointsForBigPackage } from "../validators/validate-data-feed-for-big-package";
import { BroadcastPerformer } from "./BroadcastPerformer";
import { ManifestDataProvider } from "./ManifestDataProvider";
const logger = require("./../utils/logger")("runner") as Consola;

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
    private readonly ethereumPrivateKey: string,
    private readonly manifestDataProvider: ManifestDataProvider
  ) {
    super();
    this.httpBroadcaster = new HttpBroadcaster(
      broadcasterURLs ?? DEFAULT_HTTP_BROADCASTER_URLS,
      ethereumPrivateKey
    );

    this.streamrBroadcaster = new StreamrBroadcaster(ethereumPrivateKey);
  }

  async handle(
    aggregatedPrices: PriceDataAfterAggregation[],
    pricesService: PricesService,
    iterationContext: IterationContext
  ): Promise<void> {
    // Excluding "helpful" prices, which should not be signed
    // "Helpful" prices (e.g. AVAX_SPOT) can be used to calculate TWAP values
    const pricesForSigning =
      pricesService.filterPricesForSigning(aggregatedPrices);

    // When nothing to broadcast
    if (pricesForSigning.length === 0) {
      logger.warn("No prices to broadcast, skipping broadcasting.");
      return;
    }

    // Signing
    const signedDataPackages = this.signPrices(
      pricesForSigning,
      iterationContext
    );

    // Broadcasting
    await this.broadcastDataPackages(signedDataPackages);
  }

  private signPrices(
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
          `Failed to convert price object to data point for ${price.symbol} (${price.value})`
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
      return dataPackage.sign(this.ethereumPrivateKey);
    });

    // Adding a data package with all data points
    const areEnoughDataPoint = validateDataPointsForBigPackage(
      dataPoints,
      this.manifestDataProvider.allTokensConfig
    );
    if (areEnoughDataPoint) {
      const bigDataPackage = new DataPackage(
        dataPoints,
        timeIdentifierForSigning
      );
      const signedBigDataPackage = bigDataPackage.sign(this.ethereumPrivateKey);
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
