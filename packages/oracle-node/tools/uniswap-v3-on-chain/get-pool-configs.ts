import { Contract, ethers } from "ethers";
import { config } from "../../src/config";
import { saveJSON } from "../common/fs-utils";
import UniswapV3Factory from "./UniswapV3Factory.abi.json";
import ERC20Token from "./ERC20Token.abi.json";

const POOL_CONFIGS_FILE_PATH = "uniswap-v3-ethereum-fetchers-config.json";
const UNISWAP_NAME_PREFIX = "uniswap-v3-on-chain-";

const TOKEN_ADDRESSES = [
  "0x64aa3364F17a4D01c6f1751Fd97C2BD3D7e7f1D5",
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
];

const QUOTER_ADDRESS = "0x61fFE014bA17989E743c5F6cB21bF9697530B21e";
const FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984";

const FEE_AMOUNTS = [10000, 3000, 500, 100];

const provider = new ethers.providers.JsonRpcProvider(config.ethMainRpcUrls[0]);

interface TokenParams {
  symbol: string;
  address: string;
  decimals: number;
}

interface PoolConfig {
  quoterAddress: string;
  poolAddress: string;
  token0Symbol: string;
  token1Symbol: string;
  token0Address: string;
  token1Address: string;
  token0Decimals: number;
  token1Decimals: number;
  fee: number;
}

interface TokenPoolConfigs {
  [pairName: string]: PoolConfig[];
}
interface FetcherConfigs {
  [pairName: string]: PoolConfig;
}
interface FetcherConfig {
  [basePairName: string]: FetcherConfigs;
}
interface PoolConfigs {
  [basePairName: string]: TokenPoolConfigs;
}

const getTokenParams = async (address: string): Promise<TokenParams> => {
  const tokenContract = new ethers.Contract(address, ERC20Token.abi, provider);
  const symbol = await tokenContract.symbol();
  const decimals = await tokenContract.decimals();
  return { symbol, address, decimals };
};

const findPool = async (
  tokenAddress: string,
  pairedTokenAddress: string,
  fee: number,
  factory: Contract
) => {
  const poolAddress = await factory.getPool(
    tokenAddress,
    pairedTokenAddress,
    fee
  );
  if (ethers.constants.AddressZero !== poolAddress) {
    return poolAddress;
  }
  return undefined;
};

const buildPoolConfig = (
  poolAddress: string,
  tokenParams: TokenParams,
  pairedTokenParams: TokenParams,
  fee: number
): PoolConfig => {
  return {
    quoterAddress: QUOTER_ADDRESS,
    poolAddress: poolAddress,
    token0Symbol: pairedTokenParams.symbol,
    token1Symbol: tokenParams.symbol,
    token0Address: pairedTokenParams.address,
    token1Address: tokenParams.address,
    token0Decimals: pairedTokenParams.decimals,
    token1Decimals: tokenParams.decimals,
    fee: fee,
  };
};

async function generatePoolConfigs(): Promise<FetcherConfig> {
  const poolConfigs: PoolConfigs = {};
  const uniswapV3FactoryContract = new ethers.Contract(
    FACTORY_ADDRESS,
    UniswapV3Factory.abi,
    provider
  );
  for (const tokenAddress of TOKEN_ADDRESSES) {
    const tokenParams = await getTokenParams(tokenAddress);
    const tokenPoolConfigs: TokenPoolConfigs = {};
    for (const pairedTokenAddress of TOKEN_ADDRESSES) {
      if (tokenAddress !== pairedTokenAddress) {
        for (const fee of FEE_AMOUNTS) {
          const poolAddress = await findPool(
            tokenAddress,
            pairedTokenAddress,
            fee,
            uniswapV3FactoryContract
          );

          if (poolAddress !== undefined) {
            const pairedTokenParams = await getTokenParams(pairedTokenAddress);
            const poolConfig = buildPoolConfig(
              poolAddress,
              tokenParams,
              pairedTokenParams,
              fee
            );
            if (pairedTokenParams.symbol in tokenPoolConfigs) {
              tokenPoolConfigs[pairedTokenParams.symbol].push(poolConfig);
            } else {
              tokenPoolConfigs[pairedTokenParams.symbol] = [poolConfig];
            }
          }
        }
      }
    }
    const basePairName = `${UNISWAP_NAME_PREFIX}${tokenParams.symbol}`;
    poolConfigs[basePairName] = tokenPoolConfigs;
  }

  const fetcherConfig: FetcherConfig = {};
  for (const basePairName in poolConfigs) {
    for (const token in poolConfigs[basePairName]) {
      for (const tokenConfig of poolConfigs[basePairName][token]) {
        const fetcherConfigName = `${basePairName}-${tokenConfig.fee}`;
        if (!(fetcherConfigName in fetcherConfig)) {
          fetcherConfig[fetcherConfigName] = {};
        }
        fetcherConfig[fetcherConfigName][token] = tokenConfig;
      }
    }
  }

  return fetcherConfig;
}

async function main() {
  const poolConfigs = await generatePoolConfigs();
  saveJSON(poolConfigs, POOL_CONFIGS_FILE_PATH);
}

main();
