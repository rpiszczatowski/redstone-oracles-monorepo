interface DeribitPrice {
  estimated_delivery_price: number;
  index_price: number;
}
interface DeribitError {
  message: string;
}
interface DeribitResult {
  result: DeribitPrice;
  error: DeribitError;
}

export interface DeribitResponse {
  data: DeribitResult;
}
