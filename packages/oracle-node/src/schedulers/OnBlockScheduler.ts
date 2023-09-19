import { ethers } from "ethers";
import { IScheduler, IterationContext } from "./IScheduler";

export class OnBlockScheduler implements IScheduler {
  constructor(private provider: ethers.providers.Provider) {}

  // eslint-disable-next-line @typescript-eslint/require-await
  async startIterations(
    runIterationFn: (context: IterationContext) => Promise<void>
  ) {
    this.provider.on("block", (blockNumber: number) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      runIterationFn({
        timestamp: Date.now(),
        blockNumber,
      });
    });
  }
}
