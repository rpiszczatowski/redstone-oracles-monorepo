const DEFAULT_DEVIATION_CHECK = {
  deviationWithRecentValues: {
    maxPercent: 25,
    maxDelayMilliseconds: 300000,
  },
};

function generateManifest({
  tokens,
  interval = 60000,
  sourceTimeout = 20000,
  deviationCheck = DEFAULT_DEVIATION_CHECK,
}) {
  return {
    interval,
    priceAggregator: "median",
    sourceTimeout,
    deviationCheck,
    tokens,
  };
}

module.exports = { generateManifest };
