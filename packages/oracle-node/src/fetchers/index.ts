import { ethers } from "ethers";
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
import { AvalancheEvmFetcher } from "./evm-chain/avalanche/AvalancheEvmFetcher";
import { PlatypusFetcher } from "./platypus/PlatypusFetcher";
import { LensFetcher } from "./lens/LensFetcher";
import { ChainlinkFetcher } from "./chainlink/ChainlinkFetcher";
import { XtFetcher } from "./xt/XtFetcher";
import { CoinMarketCapFetcher } from "./coinmarketcap/CoinMarketCapFetcher";

export default {
  "yf-unofficial": new YfUnofficialFetcher(),
  "custom-urls": new CustomUrlsFetcher(),
  "trader-joe": new TraderJoeFetcher(),
  "twelve-data": new TwelveDataFetcher(),
  coingecko: new CoingeckoFetcher(),
  sushiswap: new SushiswapFetcher(),
  uniswap: new UniswapFetcher(),
  drand: new DrandFetcher(),
  dia: new DiaFetcher(),
  kyber: new KyberFetcher(),
  verto: new VertoFetcher(),
  ecb: new EcbFetcher(),
  "avalanche-evm-fetcher": new AvalancheEvmFetcher(
    new ethers.providers.JsonRpcProvider(
      "https://api.avax.network/ext/bc/C/rpc"
    )
  ),
  platypus: new PlatypusFetcher(),
  chainlink: new ChainlinkFetcher(),
  lens: new LensFetcher(),
  xt: new XtFetcher(),
  coinmarketcap: new CoinMarketCapFetcher(),
  ...ccxtFetchers,
  ...pangolinFetchers,
  ...twapFetchers,
} as { [name: string]: Fetcher };
