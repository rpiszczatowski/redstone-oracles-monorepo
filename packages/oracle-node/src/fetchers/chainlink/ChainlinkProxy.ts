import { BigNumber, Contract, ContractFunction, ethers } from "ethers";
import { getRequiredPropValue } from "../../utils/objects";
import { contracts, abi } from "./constants";
import { ethereumProvider } from "../../utils/blockchain-providers";

interface contractAddressesInterface {
  [priceFeedId: string]: string;
}

export type ChainlinkResults = {
  [priceFeedId: string]: {
    price: string;
    decimalPlaces: number;
  };
};
export default class ChainlinkProxy {
  private priceFeeds!: { [priceFeedId: string]: Contract };
  private addresses: contractAddressesInterface;

  constructor() {
    this.addresses = contracts;
    this.initPriceFeedContracts();
  }

  async getExchangeRates(ids: string[]) {
    const results: ChainlinkResults = {};

    await Promise.all(
      ids.map(async (id) => {
        const priceFeedContract = getRequiredPropValue<Contract>(
          this.priceFeeds,
          id
        );
        const price = (
          await (
            priceFeedContract.latestRoundData as ContractFunction<{
              answer: BigNumber;
            }>
          )()
        ).answer.toString();
        const decimalPlaces = await (
          priceFeedContract.decimals as ContractFunction<number>
        )();
        results[id] = { price, decimalPlaces };
      })
    );
    return results;
  }

  initPriceFeedContracts() {
    this.priceFeeds = {};

    for (const id of Object.keys(this.addresses)) {
      this.priceFeeds[id] = new ethers.Contract(
        this.addresses[id],
        abi,
        ethereumProvider
      );
    }
  }
}
