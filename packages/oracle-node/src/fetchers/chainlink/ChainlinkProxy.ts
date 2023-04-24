import { Contract, ethers } from "ethers";
import { getRequiredPropValue } from "../../utils/objects";
import { contracts, abi } from "./constants";
import { ethereumProvider } from "../../utils/blockchain-providers";

interface contractAddressesInterface {
  [priceFeedId: string]: string;
}

export default class ChainlinkProxy {
  private priceFeeds!: { [priceFeedId: string]: Contract };
  private addresses: contractAddressesInterface;

  constructor() {
    this.addresses = contracts;
    this.initPriceFeedContracts();
  }

  async getExchangeRates(ids: string[]) {
    let results: { [priceFeedId: string]: any } = {};

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
