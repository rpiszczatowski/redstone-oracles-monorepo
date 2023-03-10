import axios from "axios";
import EvmPriceSigner from "../../signers/EvmPriceSigner";
import {
  MultiRequestFetcher,
  RequestIdToResponse,
} from "../MultiRequestFetcher";

const PRICES_URL = "https://api.redstone.finance/prices";
const MAX_LIMIT = 1000;

interface ShortPrice {
  timestamp: number;
  value: number;
}

export interface HistoricalPrice extends ShortPrice {
  symbol: string;
  liteEvmSignature: string;
  version: string;
}

export class TwapFetcher extends MultiRequestFetcher {
  constructor(
    private readonly sourceProviderId: string,
    private readonly providerEvmAddress: string
  ) {
    super(`twap-${sourceProviderId}`);
  }

  getRequestContext(): number {
    return Date.now();
  }

  async makeRequest(id: string): Promise<any> {
    const timestamp = Date.now();
    const { assetSymbol, millisecondsOffset } =
      TwapFetcher.parseTwapAssetId(id);
    const fromTimestamp = timestamp - millisecondsOffset;

    const responseForSymbol = await axios.get(PRICES_URL, {
      params: {
        symbol: assetSymbol,
        provider: this.sourceProviderId,
        fromTimestamp,
        toTimestamp: timestamp,
        limit: MAX_LIMIT,
      },
    });
    return responseForSymbol;
  }

  override extractPrice(
    dataFeedId: string,
    responses: RequestIdToResponse
  ): number | undefined {
    const response = responses[dataFeedId];
    this.verifySignatures(response.data);
    return TwapFetcher.getTwapValue(response.data);
  }

  private async verifySignatures(prices: HistoricalPrice[]) {
    for (const price of prices) {
      await this.verifySignature(price);
    }
  }

  private async verifySignature(price: HistoricalPrice) {
    const evmSigner = new EvmPriceSigner();
    const isSignatureValid = evmSigner.verifyLiteSignature({
      pricePackage: {
        prices: [
          {
            symbol: price.symbol,
            value: price.value,
          },
        ],
        timestamp: price.timestamp,
      },
      signerAddress: this.providerEvmAddress,
      liteSignature: price.liteEvmSignature,
    });

    if (!isSignatureValid) {
      throw new Error(
        `Received an invalid signature: ` + JSON.stringify(price)
      );
    }
  }

  static getTwapValue(historicalPrices: HistoricalPrice[]): number | undefined {
    const sortedValidPrices =
      TwapFetcher.getSortedValidPricesByTimestamp(historicalPrices);
    const prices =
      TwapFetcher.aggregatePricesWithSameTimestamps(sortedValidPrices);

    if (prices.length < 2) {
      return prices[0]?.value || undefined;
    } else {
      const totalIntervalLengthInMilliseconds =
        prices[0].timestamp - prices[prices.length - 1].timestamp;
      let twapValue = 0;

      for (
        let intervalIndex = 0;
        intervalIndex < prices.length - 1;
        intervalIndex++
      ) {
        const startPrice = prices[intervalIndex];
        const endPrice = prices[intervalIndex + 1];
        const intervalLengthInMilliseconds =
          startPrice.timestamp - endPrice.timestamp;
        const intervalWeight =
          intervalLengthInMilliseconds / totalIntervalLengthInMilliseconds;
        const intervalAveraveValue = (startPrice.value + endPrice.value) / 2;
        twapValue += intervalAveraveValue * intervalWeight;
      }

      return twapValue;
    }
  }

  // This function groups price objects with the same timestamps
  // and replaces them with a single price object with avg value
  private static aggregatePricesWithSameTimestamps(
    sortedValidPrices: HistoricalPrice[]
  ): ShortPrice[] {
    const prev = {
      timestamp: -1,
      sum: 0,
      count: 0,
    };
    const aggregatedPricesWithUniqueTimestamps = [];

    for (const price of sortedValidPrices) {
      if (prev.timestamp !== price.timestamp && prev.timestamp !== -1) {
        // Adding new avg value to the result array
        aggregatedPricesWithUniqueTimestamps.push({
          value: prev.sum / prev.count,
          timestamp: prev.timestamp,
        });

        // Resetting prev object details
        prev.sum = 0;
        prev.count = 0;
      }

      // Updating the prev object
      prev.count++;
      prev.sum += price.value;
      prev.timestamp = price.timestamp;
    }

    // Adding the last aggregated value to the result array
    aggregatedPricesWithUniqueTimestamps.push({
      value: prev.sum / prev.count,
      timestamp: prev.timestamp,
    });

    return aggregatedPricesWithUniqueTimestamps;
  }

  static parseTwapAssetId(twapSymbol: string): {
    assetSymbol: string;
    millisecondsOffset: number;
  } {
    const chunks = twapSymbol.split("-");
    return {
      assetSymbol: chunks[0],
      millisecondsOffset: Number(chunks[chunks.length - 1]) * 60 * 1000,
    };
  }

  private static getSortedValidPricesByTimestamp(
    prices: HistoricalPrice[]
  ): HistoricalPrice[] {
    const validHistoricalPrices = prices.filter((p) => !isNaN(p.value));
    validHistoricalPrices.sort((a, b) => a.timestamp - b.timestamp);
    return validHistoricalPrices;
  }
}
