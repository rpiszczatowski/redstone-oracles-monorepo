interface DeribitPrice {
  estimated_delivery_price: number;
  index_price: number;
}
interface DeribitError {
  message: string;
}
export interface DeribitResult {
  result: DeribitPrice;
  error: DeribitError;
}
