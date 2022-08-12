# 🔗 redstone-evm-connector

[![License](https://img.shields.io/badge/license-MIT-green)](https://choosealicense.com/licenses/mit/)
[![Discord](https://img.shields.io/discord/786251205008949258?logo=discord)](https://discord.gg/2CT6hN6C)
[![NPM](https://img.shields.io/npm/v/redstone-evm-connector)](https://www.npmjs.com/package/redstone-evm-connector)

[![Twitter](https://img.shields.io/twitter/follow/redstone_defi?style=flat&logo=twitter)](https://twitter.com/intent/follow?screen_name=limestone_defi)

The redstone-evm-connector module implements an alternative design of providing oracle data to smart contracts. Instead of constantly persisting data on EVM storage (by data providers), the information is brought on-chain only when needed (by end users). Until that moment data remains in the decentralised cache layer, which is powered by RedStone light cache gateways and streamr data broadcasting protocol. Data is transferred to the EVM by end users, who should attach the signed data packages to their transaction calldata. The information integrity is verified on-chain through signature checking.

TODO: Add navigation tree (in the end)

## 🚀 Working demo

<!-- TODO: replace youtube meme song with the real code sandbox demo -->

- Try it directly in CodeSandbox: [demo link](https://www.youtube.com/watch?v=dQw4w9WgXcQ)

- See a bunch of smart contract examples that use `redstone-evm-connector` in our [dedicated repo with examples](https://github.com/redstone-finance/redstone-evm-connector-examples).

## 📦 Installation

Install [redstone-evm-connector](https://www.npmjs.com/package/redstone-evm-connector) from NPM registry

```bash
# Using yarn
yarn add redstone-evm-connector

# Using NPM
npm install redstone-evm-connector
```

## 🔥 Getting started

### 1. Modifying your contracts

You need to apply a minium change to the source code to enable smart contract to access data. Your contract needs to extend one of RedstoneConsumerBase contract, which are located in the [contracts/data-services](./contracts/data-services) folder.

We strongly recommend you to have some mechanism of the contract upgradability for your contracts (it can be based on multisig, DAO, or anything else).

```js
import "redstone-evm-connector/lib/contracts/data-services/AvalancheDataServiceConsumerBase.sol";

contract YourContractName is AvalancheDataServiceConsumerBase {
  ...
}
```

💡 Note: You can also override the following functions (however we strongly recommend not to change it):

- `isTimestampValid` - to enable custom logic of timestamp validation
- `aggregateValues` - to enable custom logic of aggregating value from different providers (by default it takes the median value)
- `getAuthorisedSignerIndex` function and `uniqueSignersThreshold` contract variable - to enable custom logic of signers authorisation

After applying the mentioned change you will be able to access the data calling the local `getOracleNumericValueFromTxMsg` function. You should pass the data feed id converted to `bytes32`.

```js
// Getting single value
uint256 ethPrice = getOracleNumericValueFromTxMsg(bytes32("ETH"));

// You can also request several values
bytes32[] memory dataFeedIds = new bytes32[](2);
dataFeedIds[0] = bytes32("ETH");
dataFeedIds[1] = bytes32("BTC");
uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);
uint256 ethPrice = values[0];
uint256 btcPrice = values[1];
```

You can see all available data feeds [in our web app.](https://app.redstone.finance/#/app/providers)

### 2. Updating the interface

You should also update the code responsible for submitting transactions. If you're using [ethers.js](https://github.com/ethers-io/ethers.js/), we've prepared a dedicated library to make the transition seamless.

#### Contract object wrapping

First, you need to import the wrapper code to your project

```ts
// Typescript
import { WrapperBuilder } from "redstone-evm-connector";

// Javascript
const { WrapperBuilder } = require("redstone-evm-connector");
```

Then you can wrap your ethers contract pointing to the selected [Redstone data provider.](https://api.redstone.finance/providers) and requested data feeds.

```js
const yourEthersContract = new ethers.Contract(address, abi, provider);

// Connecting all provider's prices (consumes more GAS)
const wrappedContract = WrapperBuilder
                          .wrap(yourEthersContract)
                          .usingDataService({
                            dataServiceId: "avalanche-main-data-service"
                            uniqueSignersCount: 10,
                            dataFeeds: ["ETH", "AVAX", "BTC"]
                          });

```

Now you can access any of the contract's methods in exactly the same way as interacting with the ethers-js code:

```js
wrappedContract.executeYourMethod(arg1, arg2);
```

💡 Note: It's also possible to request pure bytes data. Take a look at [bytes-many-data-feeds.test.ts](./test/mock-wrapper/bytes-many-data-feeds.test.ts) to learn more.

## 💡 How it works

### Storage-less approach

### On-chain aggregation

### Security considerations

### Limitations

### Benchmarks

## 👨‍💻 Development and contributions

The codebase consists of a wrapper written in typescript which is responsible for packing the data and solidity smart contracts that extract the information. We encourage anyone to build and test the code and we welcome any issues with suggestions and pull requests.

### Installing the dependencies

```bash
yarn install
```

### Compiling and running the tests

```bash
yarn test
```

## 📄 License

Redstone EVM connector is an open-source and free software released under the MIT License.
