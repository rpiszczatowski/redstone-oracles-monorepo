import { ethers } from "ethers";
import { IScheduler, IterationContext } from "./IScheduler";

export class OnBlockScheduler implements IScheduler {
  constructor(private provider: ethers.providers.Provider) {}

  async startIterations(
    runIterationFn: (context: IterationContext) => Promise<void>
  ) {
    this.provider.on("block", (blockNumber: number) => {
      runIterationFn({
        timestamp: Date.now(),
        blockNumber,
      });
    });
  }
}
