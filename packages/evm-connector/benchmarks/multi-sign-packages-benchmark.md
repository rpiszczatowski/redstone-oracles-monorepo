# Multi sign packages benchmark

Currently, a Redstone payload can include multiple data packages, each signed by a unique signer. During the extraction process, the final value is obtained by aggregating all the data packages, which is known as on-chain aggregation. 

However, an alternative approach is for the signers to come to a consensus on a single value and sign it, resulting in a payload consisting of a single data package signed by multiple signers.

To evaluate the performance of these two approaches, the benchmark considers the following variables:

- The number of assets
- The number of signers required
- The number of data points (on chain aggregation approach only)


### Running the benchmark:

```
yarn test ./benchmarks/multi-sign-packages-benchmark.ts
```

## Results and conclusion:
Some of the benchmark results are presented below.
```js
  "1 signers, 1 symbols, 1 points": {
    "forAttachingDataToCalldata": 1856,
    "forDataExtractionAndVerification": 12534,
    "forAttachingDataToCalldataMultiSign": 1856,
    "forDataExtractionAndVerificationMultiSign": 11160
  },
  "10 signers, 1 symbols, 1 points": {
    "forAttachingDataToCalldata": 15812,
    "forDataExtractionAndVerification": 85618,
    "forAttachingDataToCalldataMultiSign": 11204,
    "forDataExtractionAndVerificationMultiSign": 50248
  },
  "10 signers, 20 symbols, 20 points": {
    "forAttachingDataToCalldata": 88320,
    "forDataExtractionAndVerification": 892127,
    "forAttachingDataToCalldataMultiSign": 18444,
    "forDataExtractionAndVerificationMultiSign": 152897
  }
```

The MultiSign approach offers a more efficient use of gas compared to the OnChainAggregation approach. This is because it allows for the attachment of a single data package, rather than multiple ones, resulting in lower costs for data attachment. Furthermore, the total number of data-points is reduced as each data feed has only one corresponding entry, rather than an array of possible values. This translates to lower costs for data extraction and verification since there are fewer packages and data-points to process. Additionally, there is no need for aggregation, further reducing costs.