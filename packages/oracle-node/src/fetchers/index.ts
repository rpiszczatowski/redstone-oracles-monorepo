import { Fetcher } from "../types";
import ccxtFetchers from "./ccxt/all-ccxt-fetchers";
import pangolinFetchers from "./pangolin/all-pangolin-fetchers";
import { YfUnofficialFetcher } from "./yf-unofficial/YfUnofficialFetcher";
import { CustomUrlsFetcher } from "./custom-urls/CustomUrlsFetcher";
import { TraderJoeFetcher } from "./trader-joe/TraderJoeFetcher";
import { CoingeckoFetcher } from "./coingecko/CoingeckoFetcher";
import { SushiswapFetcher } from "./sushiswap/SushiswapFetcher";
import { UniswapFetcher } from "./uniswap/UniswapFetcher";
import { KyberFetcher } from "./kyber/KyberFetcher";
import { VertoFetcher } from "./verto/VertoFetcher";
import { EcbFetcher } from "./ecb/EcbFetcher";
import { DrandFetcher } from "./drand/DrandFetcher";
import { DiaFetcher } from "./dia/DiaFetcher";
import twapFetchers from "./twap/all-twap-fetchers";
import { TwelveDataFetcher } from "./twelve-data/TwelveDataFetcher";
import { AvalancheEvmFetcher } from "./evm-chain/avalanche/evm-fetcher/AvalancheEvmFetcher";
import { PlatypusFetcher } from "./platypus/PlatypusFetcher";
import { LensFetcher } from "./lens/LensFetcher";
import { ChainlinkFetcher } from "./chainlink/ChainlinkFetcher";
import { XtFetcher } from "./xt/XtFetcher";
import { BandFetcher } from "./band/BandFetcher";
import { CoinMarketCapFetcher } from "./coinmarketcap/CoinMarketCapFetcher";
import { MockFetcher } from "./mock-fetcher/mock-fetcher";
import { KaikoFetcher } from "./kaiko/KaikoFetcher";
import { UniswapV3Fetcher } from "./uniswap-v3/UniswapV3Fetcher";
import balancerFetchers from "./balancer/all-balancer-fetchers";
import { ArbitrumEvmFetcher } from "./evm-chain/arbitrum/evm-fetcher/ArbitrumEvmFetcher";
import {
  arbitrumProvider,
  avalancheProvider,
  fallbackProvider,
} from "../utils/blockchain-providers";
import sushiswapEthereumOnChainFetchers from "./evm-chain/ethereum/sushiswap-on-chain/all-sushiswap-fetchers";
import curveFetchers from "./curve/all-curve-fetchers";
import { DeribitFetcher } from "./deribit/DeribitFetcher";
import { StlouisfedFetcher } from "./stlouisfed/StlouisfedFetcher";
import { NewyorkfedFetcher } from "./newyorkfed/NewyorkfedFetcher";
import uniswapV2OnChainFetchers from "./evm-chain/ethereum/uniswap-v2-on-chain/all-uniswap-v2-on-chain-fetchers";
import camelotFetchers from "./evm-chain/arbitrum/camelot/all-camelot-fetchers";
import { NonUsdBasedFetcher } from "./non-usd-based/NonUsdBasedFetcher";
import pangolinOnChainFetchers from "./evm-chain/avalanche/pangolin-on-chain/pangolin-on-chain-fetchers";
import traderJoeOnChainFetchers from "./evm-chain/avalanche/trader-joe-on-chain/trader-joe-on-chain-fetchers";
import twelveDataFetchers from "./twelve-data/all-twelve-data-fetchers";
import fraxswapOnChainFetchers from "./evm-chain/ethereum/fraxswap-on-chain/all-fraxswap-on-chain-fetchers";
import { CcxtFetcher } from "./ccxt/CcxtFetcher";

export default {
  "yf-unofficial": new YfUnofficialFetcher(),
  "custom-urls": new CustomUrlsFetcher(),
  "trader-joe": new TraderJoeFetcher(),
  mock: new MockFetcher(),
  coingecko: new CoingeckoFetcher(),
  sushiswap: new SushiswapFetcher(),
  uniswap: new UniswapFetcher(),
  "uniswap-v3": new UniswapV3Fetcher(),
  drand: new DrandFetcher(),
  deribit: new DeribitFetcher(),
  dia: new DiaFetcher(),
  kyber: new KyberFetcher(),
  verto: new VertoFetcher(),
  ecb: new EcbFetcher(),
  band: new BandFetcher(),
  "avalanche-evm-fetcher": new AvalancheEvmFetcher({
    avalancheProvider,
    fallbackProvider,
  }),
  platypus: new PlatypusFetcher(),
  chainlink: new ChainlinkFetcher(),
  lens: new LensFetcher(),
  xt: new XtFetcher(),
  coinmarketcap: new CoinMarketCapFetcher(),
  kaiko: new KaikoFetcher(),
  stlouisfed: new StlouisfedFetcher(),
  newyorkfed: new NewyorkfedFetcher(),
  "arbitrum-evm-fetcher": new ArbitrumEvmFetcher(arbitrumProvider),
  "non-usd-based": new NonUsdBasedFetcher(),
  "bybit-v5": new CcxtFetcher("bybit"),
  ...ccxtFetchers,
  ...pangolinFetchers,
  ...balancerFetchers,
  ...twapFetchers,
  ...sushiswapEthereumOnChainFetchers,
  ...curveFetchers,
  ...uniswapV2OnChainFetchers,
  ...camelotFetchers,
  ...pangolinOnChainFetchers,
  ...traderJoeOnChainFetchers,
  ...twelveDataFetchers,
  ...fraxswapOnChainFetchers,
} as { [name: string]: Fetcher };
