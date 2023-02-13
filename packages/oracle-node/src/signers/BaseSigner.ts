import { PriceDataBeforeSigning, PriceDataSigned } from "../types";

export abstract class BaseSigner {
  // signPricesPackage(prices: PriceDataBeforeSigning[])

  abstract signPrice(price: PriceDataBeforeSigning): Promise<PriceDataSigned>;
}
