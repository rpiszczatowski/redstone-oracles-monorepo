import { IScheduler, IterationContext } from "./IScheduler";

export class OneIterationScheduler implements IScheduler {
  async startIterations(
    runIterationFn: (context: IterationContext) => Promise<void>
  ) {
    await runIterationFn({
      timestamp: Date.now(),
    });
    console.log("Stopped the oracle node after one iteration");
    process.exit();
  }
}
