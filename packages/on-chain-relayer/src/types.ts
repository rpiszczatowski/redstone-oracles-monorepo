import { DataPackagesResponse, ValuesForDataFeeds } from "redstone-sdk";
import { IterationConfig } from "./get-iteration-args";

export interface Context {
  dataPackages: DataPackagesResponse;
  valuesFromContract: ValuesForDataFeeds;
  lastUpdateTimestamp: number;
  config: IterationConfig;
}

export interface ConditionCheckResponse {
  shouldUpdatePrices: boolean;
  warningMessage: string;
}

export type ConditionChecksNames = "time" | "value-deviation";
