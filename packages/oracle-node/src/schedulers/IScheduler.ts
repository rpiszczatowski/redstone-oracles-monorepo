export interface IterationContext {
  timestamp: number;
  blockNumber?: number;
}

export interface IScheduler {
  startIterations(
    runIterationFn: (context: IterationContext) => Promise<void>
  ): Promise<void>;
}
