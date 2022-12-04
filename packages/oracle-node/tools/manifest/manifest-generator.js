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
    evmChainId: 1,
    httpBroadcasterURLs: [
      "https://api.redstone.finance",
      "https://vwx3eni8c7.eu-west-1.awsapprunner.com",
      "https://container-service-1.dv9sai71f4rsq.eu-central-1.cs.amazonlightsail.com",
    ],
    enableStreamrBroadcaster: false,
    enableArweaveBackup: false,
    tokens,
  };
}

module.exports = { generateManifest };
