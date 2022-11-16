export const calculateDeviationPercent = (args: {
  measuredValue: number;
  trueValue: number;
}) => {
  const { measuredValue, trueValue } = args;
  return (Math.abs(measuredValue - trueValue) / trueValue) * 100;
};
