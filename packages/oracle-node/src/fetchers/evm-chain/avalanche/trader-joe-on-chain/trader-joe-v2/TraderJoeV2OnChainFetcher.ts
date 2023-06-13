import Decimal from "decimal.js";
import { Contract, providers } from "ethers";
import { DexOnChainFetcher } from "../../../../dex-on-chain/DexOnChainFetcher";
import { avalancheProvider } from "../../../../../utils/blockchain-providers";
import abi from "./TraderJoeV2LBPair.abi.json";

// Price calculation based on https://docs.traderjoexyz.com/guides/price-from-id

const ONE_AS_DECIMAL = new Decimal(1);
const BIN_STEP_DIVIDER = 10000;
const BIN_ID_DEFAULT_SUBTRACTION = 8388608;

interface BinConfig {
  binId: Decimal;
  binStep: Decimal;
}

interface PairConfig {
  [symbol: string]: {
    address: string;
    symbolX: string;
    symbolXDecimals: number;
    symbolY: string;
    symbolYDecimals: number;
  };
}

export class TraderJoeV2OnChainFetcher extends DexOnChainFetcher<BinConfig> {
  protected retryForInvalidResponse: boolean = true;

  constructor(
    name: string,
    private readonly pairConfig: PairConfig,
    private readonly provider: providers.StaticJsonRpcProvider
  ) {
    super(name);
  }

  override async makeRequest(dataFeedId: string): Promise<BinConfig> {
    const lbPair = new Contract(
      this.pairConfig[dataFeedId].address,
      abi,
      this.provider
    );

    const binId = await lbPair.getActiveId();
    const binStep = await lbPair.getBinStep();

    return {
      binStep: new Decimal(binStep),
      binId: new Decimal(binId),
    };
  }

  override calculateSpotPrice(
    _dataFeedId: string,
    response: BinConfig
  ): number {
    const { binId, binStep } = response;
    const binStepDivided = binStep.div(BIN_STEP_DIVIDER);
    const binStepPlusOne = ONE_AS_DECIMAL.add(binStepDivided);
    const binIdSerialized = binId.minus(BIN_ID_DEFAULT_SUBTRACTION);

    return binStepPlusOne.pow(binIdSerialized).toNumber();
  }

  override calculateLiquidity(): number {
    throw new Error(
      `calculateLiquidity is not implemented for ${this.getName()}`
    );
  }
}
