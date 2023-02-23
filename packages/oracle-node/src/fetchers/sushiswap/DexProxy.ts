import { Contract, ethers } from "ethers";
import { config } from "../../config";
import {
  clearPricesSublevel,
  getLastPrice,
  savePrices,
  setupLocalDb,
} from "../../db/local-db";
import {
  PriceDataAfterAggregation,
  PriceDataBeforeAggregation,
} from "../../types";
import { getRequiredPropValue } from "../../utils/objects";
import { contracts, abi, tokenAbi } from "./constants";

const preparePrice = (
  partialPrice: Partial<PriceDataAfterAggregation>
): any => {
  const testTimestamp = Date.now();
  const defaultPrice: PriceDataBeforeAggregation = {
    id: "00000000-0000-0000-0000-000000000000",
    symbol: "mock-symbol",
    source: {},
    timestamp: testTimestamp,
    version: "3",
  };
  return {
    ...defaultPrice,
    ...partialPrice,
  };
};

const preparePrices = (
  partialPrices: Partial<PriceDataAfterAggregation>[]
): any[] => partialPrices.map(preparePrice);

interface contractAddressesInterface {
  [priceFeedId: string]: string;
}

interface SymbolPair {
  symbol0: string;
  symbol1: string;
  symbol0Decimals: number;
  symbol1Decimals: number;
}

export interface SpotPrice {
  id: string;
  pairedTokenId: string;
  spotPrice: number;
}

export default class DexProxy {
  private priceFeeds!: { [priceFeedId: string]: Contract };
  private addresses: contractAddressesInterface;

  constructor() {
    this.addresses = contracts;
    this.initPriceFeedContracts();
  }

  async getExchangeRates(ids: string[]) {
    let results: { [id: string]: SpotPrice } = {};

    await Promise.all(
      ids.map(async (id) => {
        let sushiswapV2Pair = getRequiredPropValue(this.priceFeeds, id);
        const answer = await sushiswapV2Pair.getReserves();
        const { _reserve0, _reserve1 } = answer;

        const token0 = await sushiswapV2Pair.token0();
        const token1 = await sushiswapV2Pair.token1();

        const { symbol0, symbol1, symbol0Decimals, symbol1Decimals } =
          await this.getSymbols(token0, token1);

        console.log(symbol0, symbol1);
        const pairedTokenId = symbol0 === id ? symbol1 : symbol0;

        const reserve0Serialized = _reserve0.div(
          ethers.utils.parseUnits("1.0", symbol0Decimals)
        );

        const reserve1Serialized = _reserve1.div(
          ethers.utils.parseUnits("1.0", symbol1Decimals)
        );

        const balanceRatio =
          symbol0 === id
            ? reserve1Serialized / reserve0Serialized
            : reserve0Serialized / reserve1Serialized;

        const pairedTokenPrice = this.getPairedTokenPrice(pairedTokenId);

        const spotPrice = balanceRatio * pairedTokenPrice;

        results[id] = {
          spotPrice,
          id,
          pairedTokenId,
        };
      })
    );
    return results;
  }

  initPriceFeedContracts() {
    this.priceFeeds = {};

    const provider = new ethers.providers.JsonRpcProvider(config.ethMainRpcUrl);
    for (const id of Object.keys(this.addresses)) {
      this.priceFeeds[id] = new ethers.Contract(
        this.addresses[id],
        abi,
        provider
      );
    }
  }

  getPairedTokenPrice(id: string): number {
    return getLastPrice(id)!.value;
  }

  async getSymbols(token0: string, token1: string): Promise<SymbolPair> {
    const provider = new ethers.providers.JsonRpcProvider(config.ethMainRpcUrl);
    const pairedTokenContract0 = new ethers.Contract(
      token0,
      tokenAbi,
      provider
    );

    const symbol0 = await pairedTokenContract0.symbol();
    const symbol0Decimals = await pairedTokenContract0.decimals();

    console.log(await pairedTokenContract0.decimals());
    const pairedTokenContract1 = new ethers.Contract(
      token1,
      tokenAbi,
      provider
    );

    const symbol1 = await pairedTokenContract1.symbol();
    const symbol1Decimals = await pairedTokenContract1.decimals();

    return { symbol0, symbol1, symbol0Decimals, symbol1Decimals };
  }
}

const main = async () => {
  setupLocalDb();
  clearPricesSublevel();

  await savePrices(
    preparePrices([
      { symbol: "DAI", value: 2 },
      { symbol: "WETH", value: 1690 },
    ])
  );

  let sut = new DexProxy();
  let results = await sut.getExchangeRates(["WBTC"]);
  console.log(results);
};

main();
