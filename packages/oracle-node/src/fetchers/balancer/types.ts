export interface SpotPrice {
  id: string;
  pairedTokenPrice: number;
  spotPrice: number;
}
export interface PriceWithPromiseStatus {
  status: string;
  value: SpotPrice;
}
