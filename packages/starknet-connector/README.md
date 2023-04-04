# 🔗 @redstone-finance/starknet-connector

[![License](https://img.shields.io/badge/license-MIT-green)](https://choosealicense.com/licenses/mit/)
[![Discord](https://img.shields.io/discord/786251205008949258?logo=discord)](https://discord.gg/2CT6hN6C)
[![NPM](https://img.shields.io/npm/v/@redstone-finance/starknet-connector)](https://www.npmjs.com/package/@redstone-finance/starknet-connector)
[![Twitter](https://img.shields.io/twitter/follow/redstone_defi?style=flat&logo=twitter)](https://twitter.com/intent/follow?screen_name=limestone_defi)

The @redstone-finance/starknet-connector module implements an alternative design of providing oracle data to smart contracts. Instead of constantly persisting data on Starknet storage (by data providers), the information is brought on-chain only when needed (by end users). Until that moment data remains in the decentralised cache layer, which is powered by RedStone light cache gateways and streamr data broadcasting protocol. Data is transferred to the Starknet by end users. The information integrity is verified on-chain through signature checking.

- [📦 Installation](#-installation)
- [🔥 Getting started](#-getting-started)
    - [1. The contract](#1-the-contract)
    - [2. Connecing to the contract](#2-connecting-to-the-contract)
- [👨‍💻 Development and contributions](#-development-and-contributions)
    - [Installing the dependencies](#installing-the-dependencies)
- [📄 License](#-license)
<!-- The table of contents above was generated by https://ecotrust-canada.github.io/markdown-toc/ -->

## 📦 Installation

Install [@redstone-finance/starknet-connector](https://www.npmjs.com/package/@redstone-finance/starknet-connector) from NPM registry

```bash
# Using yarn
yarn add @redstone-finance/starknet-connector

# Using NPM
npm install @redstone-finance/starknet-connector
```

## 🔥 Getting started

### 1. The contract

You can read [here](https://github.com/redstone-finance/redstone-oracles-monorepo/blob/main/packages/starknet-connector/cairo/src/contracts/README.md) how the contract works.
Here also you can find the description of the [whole RedStone Oracle model](https://docs.redstone.finance/docs/introduction).

#### 2. Connecting to the contract

First, you need to import the connector code to your project

```ts
// Typescript
import { StarknetPricesContractConnector, StarknetContractParamsProvider } from "@redstone-finance/starknet-connector";

// Javascript
const { StarknetPricesContractConnector, StarknetContractParamsProvider } = require("@redstone-finance/starknet-connector");
```

Then you can the contract methods described above pointing to the selected [redstone data service](https://app.redstone.finance) and requested data feeds.

```ts
const prices = new StarknetPricesContractConnector(account, yourContractAddress, "goerli-alpha");

const paramsProvider = new StarknetContractParamsProvider({
                            dataServiceId: "avalanche-main-data-service",
                            uniqueSignersCount: 1,
                            dataFeeds: ["ETH", "AVAX", "BTC"]
                          });

```
The `account` param is needed to be passed for storage-write-methods. Otherwise, it can remain undefined.

Now you can access any of the contract's methods in exactly the same way as interacting with the ethers-js code:

```ts
(await prices.getAdapter()).getPricesFromPayload(paramsProvider);
```


## 👨‍💻 Development and contributions

The codebase consists of a wrapper written in typescript which is responsible for packing the data and cairo smart contracts that extract the information. We encourage anyone to build and test the code and we welcome any issues with suggestions and pull requests.

### Installing the dependencies

```bash
yarn install
```

## 📄 License

Redstone Starknet connector is an open-source and free software released under the BUSL-1.1 License.