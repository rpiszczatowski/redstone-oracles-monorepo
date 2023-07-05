import git from "git-last-commit";
import { ethers } from "ethers";
import { Consola } from "consola";
import ManifestHelper, { TokensBySource } from "./manifest/ManifestHelper";
import ArweaveService from "./arweave/ArweaveService";
import { promiseTimeout, TimeoutError } from "./utils/promise-timeout";
import { mergeObjects } from "./utils/objects";
import { ExpressAppRunner } from "./ExpressAppRunner";
import {
  printTrackingState,
  trackEnd,
  trackStart,
} from "./utils/performance-tracker";
import PricesService, {
  PricesBeforeAggregation,
  PricesDataFetched,
} from "./fetchers/PricesService";
import { Manifest, NodeConfig, PriceDataAfterAggregation } from "./types";
import { fetchIp } from "./utils/ip-fetcher";
import { config } from "./config";
import { connectToDb } from "./db/remote-mongo/db-connector";
import { AggregatedPriceHandler } from "./aggregated-price-handlers/AggregatedPriceHandler";
import { AggregatedPriceLocalDBSaver } from "./aggregated-price-handlers/AggregatedPriceLocalDBSaver";
import { DataPackageBroadcastPerformer } from "./aggregated-price-handlers/DataPackageBroadcastPerformer";
import { PriceDataBroadcastPerformer } from "./aggregated-price-handlers/PriceDataBroadcastPerformer";
import { ManifestDataProvider } from "./aggregated-price-handlers/ManifestDataProvider";
import { IterationContext } from "./schedulers/IScheduler";
import { stringifyError } from "./utils/error-stringifier";

const logger = require("./utils/logger")("runner") as Consola;
const pjson = require("../package.json") as any;

const MANIFEST_LOAD_TIMEOUT_MS = 25 * 1000;
const DIAGNOSTIC_INFO_PRINTING_INTERVAL = 60 * 1000;

export default class NodeRunner {
  private readonly version: string;

  private lastManifestLoadTimestamp?: number;
  // note: all below '?' class fields have to be re-initialized after reading
  // new manifest in this.useNewManifest(manifest); - as they depend on the current manifest.
  private currentManifest?: Manifest;
  private pricesService?: PricesService;
  private tokensBySource?: TokensBySource;
  private newManifest: Manifest | null = null;
  private readonly manifestDataProvider = new ManifestDataProvider();

  private readonly aggregatedPriceHandlers: AggregatedPriceHandler[];

  private constructor(
    private readonly arweaveService: ArweaveService,
    private readonly providerAddress: string,
    private readonly nodeConfig: NodeConfig,
    initialManifest: Manifest
  ) {
    const ethereumPrivKey = nodeConfig.privateKeys.ethereumPrivateKey;
    this.version = getVersionFromPackageJSON();
    this.useNewManifest(initialManifest);
    this.lastManifestLoadTimestamp = Date.now();
    const httpBroadcasterURLs = config.overrideDirectCacheServiceUrls;
    const priceHttpBroadcasterURLs = config.overridePriceCacheServiceUrls;

    this.aggregatedPriceHandlers = [
      new AggregatedPriceLocalDBSaver(),
      new DataPackageBroadcastPerformer(
        httpBroadcasterURLs,
        ethereumPrivKey,
        this.manifestDataProvider
      ),
      new PriceDataBroadcastPerformer(
        priceHttpBroadcasterURLs,
        ethereumPrivKey,
        this.providerAddress
      ),
    ];

    // https://www.freecodecamp.org/news/the-complete-guide-to-this-in-javascript/
    // alternatively use arrow functions...
    this.runIteration = this.runIteration.bind(this);
    this.handleLoadedManifest = this.handleLoadedManifest.bind(this);
  }

  static async create(nodeConfig: NodeConfig): Promise<NodeRunner> {
    // Running a simple web server
    // It should be called as early as possible
    // Otherwise App Runner crashes ¯\_(ツ)_/¯
    new ExpressAppRunner(nodeConfig).run();
    await connectToDb();
    const providerAddress = new ethers.Wallet(
      nodeConfig.privateKeys.ethereumPrivateKey
    ).address;
    const arweaveService = new ArweaveService();

    let manifestData = null;
    if (nodeConfig.overrideManifestUsingFile) {
      manifestData = nodeConfig.overrideManifestUsingFile;
    } else {
      while (true) {
        logger.info("Fetching manifest data.");
        try {
          manifestData = await arweaveService.getCurrentManifest();
        } catch (e: any) {
          logger.error("Initial manifest read failed.", e.stack || e);
        }
        if (manifestData !== null) {
          logger.info("Fetched manifest", manifestData);
          break;
        }
      }
    }

    return new NodeRunner(
      arweaveService,
      providerAddress,
      nodeConfig,
      manifestData
    );
  }

  async run(): Promise<void> {
    await this.printInitialNodeDetails();
    this.maybeRunDiagnosticInfoPrinting();

    try {
      const scheduler = ManifestHelper.getScheduler(this.currentManifest!);
      await scheduler.startIterations(this.runIteration);
    } catch (e: any) {
      logger.error(stringifyError(e));
    }
  }

  private async printInitialNodeDetails() {
    const ipAddress = await fetchIp();
    logger.info(`Node evm address: ${this.providerAddress}`);
    logger.info(`Version from package.json: ${this.version}`);
    logger.info(`Node's IP address: ${ipAddress}`);
    logger.info(
      `Initial node manifest:
      ${JSON.stringify(this.currentManifest)}
    `
    );

    // Printing git details
    git.getLastCommit((err, commit) => {
      if (err) {
        logger.error(err);
      } else {
        logger.info(
          `Git details: ${commit.hash} (latest commit), ` +
            `${commit.branch} (branch), ` +
            `${commit.subject} (latest commit message)`
        );
      }
    });
  }

  private maybeRunDiagnosticInfoPrinting() {
    if (this.nodeConfig.printDiagnosticInfo) {
      const printDiagnosticInfo = () => {
        const memoryUsage = process.memoryUsage();
        const activeRequests = (process as any)._getActiveRequests();
        const activeHandles = (process as any)._getActiveHandles();
        logger.info(
          `Diagnostic info: ` +
            `Active requests count: ${activeRequests.length}. ` +
            `Active handles count: ${activeHandles.length}. ` +
            `Memory usage: ${JSON.stringify(memoryUsage)}. `
        );
        console.log({ activeRequests });
      };

      printDiagnosticInfo();
      setInterval(printDiagnosticInfo, DIAGNOSTIC_INFO_PRINTING_INTERVAL);
    }
  }

  private async runIteration(iterationContext: IterationContext) {
    logger.info("Running new iteration: " + JSON.stringify(iterationContext));

    if (this.newManifest !== null) {
      logger.info("Using new manifest: ", this.newManifest.txId);
      this.useNewManifest(this.newManifest);
    }

    this.maybeLoadManifestFromSmartContract();
    await this.safeProcessManifestTokens(iterationContext);

    printTrackingState();
  }

  private async safeProcessManifestTokens(iterationContext: IterationContext) {
    const processingAllTrackingId = trackStart("processing-all");
    try {
      await this.doProcessTokens(iterationContext);
    } catch (e: any) {
      logger.error(stringifyError(e));
    } finally {
      trackEnd(processingAllTrackingId);
    }
  }

  private async doProcessTokens(
    iterationContext: IterationContext
  ): Promise<void> {
    logger.info("Processing tokens");

    // Fetching and aggregating
    const aggregatedPrices: PriceDataAfterAggregation[] =
      await this.fetchPrices(iterationContext);

    if (aggregatedPrices.length === 0) {
      logger.info("No aggregated prices to process");

      return;
    }

    for (const processor of this.aggregatedPriceHandlers) {
      await processor.handle(
        aggregatedPrices,
        this.pricesService!,
        iterationContext
      );
    }
  }

  private async fetchPrices(
    iterationContext: IterationContext
  ): Promise<PriceDataAfterAggregation[]> {
    const fetchingAllTrackingId = trackStart("fetching-all");

    const fetchedPrices = await this.pricesService!.fetchInParallel(
      this.tokensBySource!
    );
    const pricesData: PricesDataFetched = mergeObjects(fetchedPrices);
    const pricesBeforeAggregation: PricesBeforeAggregation =
      PricesService.groupPricesByToken(
        iterationContext,
        pricesData,
        this.version
      );

    const aggregatedPrices: PriceDataAfterAggregation[] =
      await this.pricesService!.calculateAggregatedValues(
        Object.values(pricesBeforeAggregation)
      );
    NodeRunner.printAggregatedPrices(aggregatedPrices);
    trackEnd(fetchingAllTrackingId);
    return aggregatedPrices;
  }

  private static printAggregatedPrices(
    prices: PriceDataAfterAggregation[]
  ): void {
    for (const price of prices) {
      const sourcesData = JSON.stringify(price.source);
      logger.info(
        `Fetched price : ${price.symbol} : ${price.value} | ${sourcesData}`
      );
    }
  }

  // TODO: refactor to a separate service?
  private maybeLoadManifestFromSmartContract() {
    if (this.nodeConfig.overrideManifestUsingFile) {
      return;
    }

    const now = Date.now();
    const timeDiff = now - this.lastManifestLoadTimestamp!;
    logger.info("Checking time since last manifest load", {
      timeDiff,
      manifestRefreshInterval: this.nodeConfig.manifestRefreshInterval,
    });
    if (timeDiff >= this.nodeConfig.manifestRefreshInterval) {
      this.lastManifestLoadTimestamp = now;
      logger.info("Trying to fetch new manifest version.");
      const manifestFetchTrackingId = trackStart("Fetching manifest.");
      // note: not using "await" here, as loading manifest's data takes about 6 seconds and we do not want to
      // block standard node processing for so long (especially for nodes with low "interval" value)
      promiseTimeout(
        () => this.arweaveService.getCurrentManifest(),
        MANIFEST_LOAD_TIMEOUT_MS
      )
        .then((value) => {
          this.handleLoadedManifest(value as Manifest);
        })
        .catch((error) => {
          if (error instanceof TimeoutError) {
            logger.warn("Manifest load promise timeout");
          } else {
            logger.info("Error while calling manifest load function");
          }
        })
        .finally(() => {
          trackEnd(manifestFetchTrackingId);
        });
    } else {
      logger.info("Skipping manifest download in this iteration run.");
    }
  }

  private handleLoadedManifest(loadedManifest: Manifest | null) {
    if (!loadedManifest) {
      return;
    }
    logger.info("Manifest successfully loaded", {
      loadedManifestTxId: loadedManifest.txId,
      currentTxId: this.currentManifest?.txId,
    });
    if (loadedManifest.txId != this.currentManifest?.txId) {
      logger.info(
        "Loaded and current manifest differ, updating on next runIteration call."
      );
      // we're temporarily saving loaded manifest on a separate "newManifest" field
      // - calling "this.useNewManifest(this.newManifest)" here could cause that
      // that different manifests would be used by different services during given "runIteration" execution.
      this.newManifest = loadedManifest;
      loadedManifest = null;
    } else {
      logger.info("Loaded manifest same as current, not updating.");
    }
  }

  private useNewManifest(newManifest: Manifest) {
    ManifestHelper.validateManifest(newManifest);
    this.currentManifest = newManifest;
    this.pricesService = new PricesService(newManifest);
    this.tokensBySource = ManifestHelper.groupTokensBySource(newManifest);
    this.manifestDataProvider.handleManifest(newManifest);
    this.newManifest = null;
  }
}

function getVersionFromPackageJSON() {
  const [major, minor] = pjson.version.split(".");
  return major + "." + minor;
}
