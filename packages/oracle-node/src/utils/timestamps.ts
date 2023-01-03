// Rounds timestamp for better node synchronization and querying historical data
export const roundTimestamp = (timestamp: number): number => {
  return Math.floor(timestamp / 1000) * 1000;
};
