import { Manifest } from "../types";
import { config } from "../config";
import { CronScheduler } from "./CronScheduler";
import { OnBlockScheduler } from "./OnBlockScheduler";
import { ethers } from "ethers";

export type SchedulerName = keyof typeof schedulerGetters;

const ARBITRUM_NETWORK_NAME = "Arbitrum One";
const ARBITRUM_CHAIN_ID = 42161;

// TODO: create a separate module with providers registry in the oracle-node
const arbitrumProvider = new ethers.providers.StaticJsonRpcProvider(
  config.arbitrumRpcUrl,
  {
    name: ARBITRUM_NETWORK_NAME,
    chainId: ARBITRUM_CHAIN_ID,
  }
);

const schedulerGetters = {
  "on-each-arbitrum-block": () => new OnBlockScheduler(arbitrumProvider),
  interval: (manifest: Manifest) => new CronScheduler(manifest.interval!),
};

export const getScheduler = (
  schedulerName: SchedulerName,
  manifest: Manifest
) => schedulerGetters[schedulerName](manifest);
