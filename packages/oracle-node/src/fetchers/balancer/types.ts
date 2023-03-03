export interface SpotPrice {
  assetId: string;
  pairedTokenPrice: number;
  spotPrice: number;
  liquidity: number;
}

export interface PriceWithPromiseStatus {
  status: string;
  value: SpotPrice;
}
