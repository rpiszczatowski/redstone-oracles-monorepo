import redstone from "redstone-api";
import { BigNumber, ethers, providers } from "ethers";
import { Interface } from "ethers/lib/utils";
import { BaseFetcher } from "../BaseFetcher";
import { EvmMulticallService } from "./EvmMulticallService";
import { yieldYakContractDetails } from "./contracts-details/yield-yak";
import { MulticallParsedResponses, PricesObj } from "../../types";

type YieldYakDetailsKeys = keyof typeof yieldYakContractDetails;

const MUTLICALL_CONTRACT_ADDRESS = "0x8755b94F88D120AB2Cc13b1f6582329b067C760d";

export class AvalancheEvmFetcher extends BaseFetcher {
  private evmMulticallService: EvmMulticallService;

  constructor(
    provider: providers.Provider,
    multicallContractAddress: string = MUTLICALL_CONTRACT_ADDRESS
  ) {
    super("avalanche-evm-fetcher");
    this.evmMulticallService = new EvmMulticallService(
      provider,
      multicallContractAddress
    );
  }

  async fetchData(ids: string[]) {
    const requests = [];
    for (const id of ids) {
      const requestsPerId = this.prepareMulticallRequests(id);
      requests.push(...requestsPerId);
    }
    return await this.evmMulticallService.performMulticall(requests);
  }

  prepareMulticallRequests(id: string) {
    const { abi, address } = yieldYakContractDetails[id as YieldYakDetailsKeys];
    const totalDepositsData = new Interface(abi).encodeFunctionData(
      "totalDeposits"
    );
    const totalSupplyData = new Interface(abi).encodeFunctionData(
      "totalSupply"
    );
    const requests = [
      {
        address,
        data: totalDepositsData,
        name: "totalDeposits",
      },
      {
        address,
        data: totalSupplyData,
        name: "totalSupply",
      },
    ];
    return requests;
  }

  async extractPrices(
    response: MulticallParsedResponses,
    ids: string[]
  ): Promise<PricesObj> {
    const pricesObject: PricesObj = {};
    for (const id of ids) {
      const price = await this.extractPriceForYieldYak(response, id);
      pricesObject[id] = Number(price);
    }
    return pricesObject;
  }

  async extractPriceForYieldYak(
    multicallResult: MulticallParsedResponses,
    id: string
  ) {
    const { address } = yieldYakContractDetails[id as YieldYakDetailsKeys];

    const totalDeposits = BigNumber.from(
      multicallResult[address].totalDeposits.value
    );
    const totalSupply = BigNumber.from(
      multicallResult[address].totalSupply.value
    );
    const tokenValue = totalDeposits
      .mul(ethers.utils.parseUnits("1.0", 8))
      .div(totalSupply);

    const tokenPrice = await this.fetchTokenPrice(id);
    const yieldYakPrice = tokenValue
      .mul(tokenPrice)
      .div(ethers.utils.parseUnits("1.0", 8));

    return ethers.utils.formatEther(yieldYakPrice);
  }

  async fetchTokenPrice(id: string) {
    switch (id) {
      case "YYAV3SA1": {
        return this.fetchAVAXPrice();
      }
      case "SAV2": {
        return this.fetchSAVAXPrice();
      }
      default:
        throw new Error("Invalid id for Avalanche EVM fetcher");
    }
  }

  async fetchAVAXPrice() {
    const avaxPriceObjectFromApi = await redstone.getPrice("AVAX");
    const avaxPriceAsString = avaxPriceObjectFromApi.value.toString();
    return ethers.utils.parseUnits(avaxPriceAsString, 18);
  }

  async fetchSAVAXPrice() {
    const avaxPriceObjectFromApi = await redstone.getPrice("sAVAX");
    const avaxPriceAsString = avaxPriceObjectFromApi.value.toString();
    return ethers.utils.parseUnits(avaxPriceAsString, 18);
  }
}
