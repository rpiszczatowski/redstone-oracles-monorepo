import {
  NumericDataPoint,
  DataPackage,
  SignedDataPackage,
} from "redstone-protocol";
import { PricePackage } from "../types";

export default class EvmPriceSigner {
  signPricePackage(
    pricePackage: PricePackage,
    privateKey: string
  ): SignedDataPackage {
    const dataPoints = pricePackage.prices.map(
      (priceObj) =>
        new NumericDataPoint({
          dataFeedId: priceObj.symbol,
          value: priceObj.value,
        })
    );
    const dataPackage = new DataPackage(dataPoints, pricePackage.timestamp);
    return dataPackage.sign(privateKey);
  }
}
