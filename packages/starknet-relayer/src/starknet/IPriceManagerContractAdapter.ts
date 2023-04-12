export interface IPriceManagerContractAdapter {
  readTimestampAndRound(): Promise<any>;

  writePrices(round: number): Promise<string>;
}

export function getNumberFromStarknet(value: any) {
  return Number(value.toString());
}
