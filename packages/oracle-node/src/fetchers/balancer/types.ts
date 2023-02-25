export interface SpotPrice {
  symbol: string;
  pairedTokenPrice: number;
  spotPrice: number;
  liquidity: string;
}

export interface PriceWithPromiseStatus {
  status: string;
  value: SpotPrice;
}
