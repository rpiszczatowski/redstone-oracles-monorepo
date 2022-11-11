import { Contract, ethers } from "ethers";
import { getRequiredPropValue } from "../../utils/objects";
import { contracts, abi, ETH_MAIN_RPC_URL } from "./constants";

interface contractAddressesInterface {
  [key: string]: string;
}

export default class ChainlinkProxy {
  private priceFeeds: { [name: string]: Contract };
  private addresses: contractAddressesInterface;

  constructor() {
    this.addresses = contracts;
    this.priceFeeds = {};
    this.createPriceFeeds();
  }

  async getExchangeRates(ids: string[]) {
    let results: { [name: string]: any } = {};

    await Promise.all(
      ids.map(async (id) => {
        let priceFeedContract = getRequiredPropValue(this.priceFeeds, id);
        const price = (
          await priceFeedContract.latestRoundData()
        ).answer.toString();
        const decimalPlaces = await priceFeedContract.decimals();
        results[id] = { price, decimalPlaces };
      })
    );
    return results;
  }

  createPriceFeeds() {
    const provider = new ethers.providers.JsonRpcProvider(ETH_MAIN_RPC_URL);
    for (const id of Object.keys(this.addresses)) {
      this.priceFeeds[id] = new ethers.Contract(
        this.addresses[id],
        abi,
        provider
      );
    }
  }
}
