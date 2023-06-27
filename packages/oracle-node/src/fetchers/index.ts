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
import { EcbFetcher } from "./ecb/EcbFetcher";
import { DrandFetcher } from "./drand/DrandFetcher";
import { DiaFetcher } from "./dia/DiaFetcher";
import twapFetchers from "./twap/all-twap-fetchers";
import { avalancheEvmFetcher } from "./evm-chain/avalanche/evm-fetcher/AvalancheEvmFetcher";
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
import uniswapV3Fetchers from "./evm-chain/uniswap-v3-on-chain/all-uniswap-v3-fetchers";
import { arbitrumEvmFetcher } from "./evm-chain/arbitrum/evm-fetcher/ArbitrumEvmFetcher";
import sushiswapEthereumOnChainFetchers from "./evm-chain/ethereum/sushiswap-on-chain/all-sushiswap-fetchers";
import curveFetchers from "./curve/all-curve-fetchers";
import { DeribitFetcher } from "./deribit/DeribitFetcher";
import { StlouisfedFetcher } from "./stlouisfed/StlouisfedFetcher";
import { NewyorkfedFetcher } from "./newyorkfed/NewyorkfedFetcher";
import uniswapV2OnChainFetchers from "./evm-chain/ethereum/uniswap-v2-on-chain/all-uniswap-v2-on-chain-fetchers";
import camelotFetchers from "./evm-chain/arbitrum/camelot/all-camelot-fetchers";
import { NonUsdBasedFetcher } from "./non-usd-based/NonUsdBasedFetcher";
import pangolinOnChainFetchers from "./evm-chain/avalanche/pangolin-on-chain/pangolin-on-chain-fetchers";
import traderJoeOnChainFetchers from "./evm-chain/avalanche/trader-joe-on-chain/trader-joe-v1/trader-joe-on-chain-fetchers";
import twelveDataFetchers from "./twelve-data/all-twelve-data-fetchers";
import { PermaswapFetcher } from "./permaswap/PermaswapFetcher";
import fraxswapOnChainFetchers from "./evm-chain/ethereum/fraxswap-on-chain/all-fraxswap-on-chain-fetchers";
import { MaverickFetcher } from "./maverick/MaverickFetcher";
import { ethereumEvmFetcher } from "./evm-chain/ethereum/evm-fetcher/EthereumEvmFetcher";
import balancerMultiFetchers from "./balancer-multi/all-balancers-multi-fetchers";
import traderJoeV2OnChainFetchers from "./evm-chain/avalanche/trader-joe-on-chain/trader-joe-v2/trader-joe-v2-on-chain-fetchers";
import { FixedValueFetcher } from "./fixed-value-fetcher/fixed-value-fetcher";

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
  ecb: new EcbFetcher(),
  band: new BandFetcher(),
  "avalanche-evm-fetcher": avalancheEvmFetcher,
  platypus: new PlatypusFetcher(),
  chainlink: new ChainlinkFetcher(),
  lens: new LensFetcher(),
  xt: new XtFetcher(),
  coinmarketcap: new CoinMarketCapFetcher(),
  kaiko: new KaikoFetcher(),
  stlouisfed: new StlouisfedFetcher(),
  newyorkfed: new NewyorkfedFetcher(),
  permaswap: new PermaswapFetcher(),
  "arbitrum-evm-fetcher": arbitrumEvmFetcher,
  "non-usd-based": new NonUsdBasedFetcher(),
  maverick: new MaverickFetcher(),
  "ethereum-evm-fetcher": ethereumEvmFetcher,
  "fixed-value": new FixedValueFetcher(),
  ...ccxtFetchers,
  ...pangolinFetchers,
  ...balancerFetchers,
  ...twapFetchers,
  ...uniswapV3Fetchers,
  ...sushiswapEthereumOnChainFetchers,
  ...curveFetchers,
  ...uniswapV2OnChainFetchers,
  ...camelotFetchers,
  ...pangolinOnChainFetchers,
  ...traderJoeOnChainFetchers,
  ...twelveDataFetchers,
  ...fraxswapOnChainFetchers,
  ...balancerMultiFetchers,
  ...traderJoeV2OnChainFetchers,
} as { [name: string]: Fetcher };
