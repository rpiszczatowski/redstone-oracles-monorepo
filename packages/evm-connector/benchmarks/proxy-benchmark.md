# Proxy Benchmark

A proxy contract is a type of smart contract that allows other contracts to be executed without direct interaction. In the context of obtaining oracle values on a blockchain, a proxy contract receives a redstone payload and makes calls to other contracts, passing them the oracle values.

Currently, we are testing two different implementations of a proxy: the ProxyConnector-based approach and the StorageProxy-based approach. The first approach, when making a call to other contracts, attaches the redstone payload to the calldata and relies on the other contract to extract the values from it. The second approach extracts the values from the redstone payload and stores them in storage. Then, the other contracts can access the values by reading them from the proxy contract's storage.

The benchmarks evaluate the performance based on the following variables:

- The number of assets
- The number of signers required
- The length of the proxy chain

In other words, the benchmark results will depend on how many assets are being handled, how many individuals need to sign off on the transaction, and how many proxy contracts are involved in the process.

### Running the benchmark:

```
yarn test ./benchmarks/proxy-benchmark.ts
```
