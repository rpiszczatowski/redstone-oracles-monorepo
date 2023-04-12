export interface IPriceFeedContractAdapter {
  readLatestRoundData(): Promise<any>;
}
