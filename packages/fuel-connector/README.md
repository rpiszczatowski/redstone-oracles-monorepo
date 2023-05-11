# 🔗 @redstone-finance/fuel-connector

[![License](https://img.shields.io/badge/license-MIT-green)](https://choosealicense.com/licenses/mit/)
[![Discord](https://img.shields.io/discord/786251205008949258?logo=discord)](https://discord.gg/2CT6hN6C)
[![Twitter](https://img.shields.io/twitter/follow/redstone_defi?style=flat&logo=twitter)](https://twitter.com/intent/follow?screen_name=redstone_defi)

Proudly supported by:
![Fuel Grants Program](fuel-grants-program.png)

RedStone proposes a completely new modular design where data is first put into a data availability layer and then
fetched on-chain. This allow us to broadcast a large number of assets at high frequency to a cheaper layer and put it on
chain only when required by the protocol.

The @redstone-finance/fuel-connector module implements an alternative design of providing oracle data to smart
contracts. Instead of constantly persisting data on the Fuel network storage (by data providers), the information is
brought on-chain only when needed (by end users). Until that moment data remains in the decentralised cache layer, which
is powered by RedStone light cache gateways and streamr data broadcasting protocol. Data is transferred to the Fuel
network by end users. The information integrity is verified on-chain through signature checking.

- [🔥 Getting started](#-getting-started)
  - [1. Code structure](#1-code-structure)
  - [2. The contract](#2-the-contract)
  - [3. Connecing to the contract](#2-connecting-to-the-contract)
- [👨‍💻 Development and contributions](#-development-and-contributions)
  - [Installing the dependencies](#installing-the-dependencies)
- [⚡ The Fuel Grants Program](#-the-fuel-grants-program)
- [📄 License](#-license)

## 🔥 Getting started

### 1. Code structure

- [sway](sway) directory contains the fuel-network on-chain libraries written in sway 0.35.5.
  - You can find all the possibilities [here](sway/contract/README.md).
  - You can read [here](sway/contract/README.md) how the contract works.
  - Here also you can find the description of
    the [whole RedStone Oracle model](https://docs.redstone.finance/docs/introduction).
- [src](src) directory contains the typescript classes, to be used to establish connection between typescript and
  fuel-network layers.
  - See [here](#2-connecting-to-the-contract), how to connect to the contract.
- [test](test) directory contains the off-chain tests, especially:
  - contract usage tests - with payload sending and receiving data
  - integration tests - to be used for checking if the contract is properly initialized in the fuel network
  - gas usage tests - to be used for checking the gas costs of particular operations in various configurations and also
    the summary of the single item costs.
  - a piece of code for transferring ETHs from genesis accounts on the local network

### 2. Connecting to the contract

First, you need to import the connector code to your project

```ts
// Typescript
import {FuelPricesContractConnector} from "@redstone-finance/fuel-connector";
import {ContractParamsProvider} from "redstone-sdk";

// Javascript
const {FuelPricesContractConnector} = require("@redstone-finance/fuel-connector");
const {ContractParamsProvider} = require("redstone-sdk");
```

Then you can the contract methods described above pointing to the
selected [RedStone data service](https://app.redstone.finance) and requested data feeds.

```ts
const prices = new FuelPricesContractConnector(yourWalletOrProvider, yourContractAddress);

const paramsProvider = new ContractParamsProvider({
  dataServiceId: "avalanche-main-data-service",
  uniqueSignersCount: 1,
  dataFeeds: ["ETH", "AVAX", "BTC"]
});

```

The `account` param is needed to be passed for storage-write-methods. Otherwise, it can remain undefined.

Now you can access any of the contract's methods by invoking the code:

```ts
(await prices.getAdapter()).getPricesFromPayload(paramsProvider);
(await prices.getAdapter()).writePricesFromPayloadToContract(paramsProvider);
(await prices.getAdapter()).readPricesFromContract(paramsProvider);
(await prices.getAdapter()).readTimestampFromContract();

```

### Installing the dependencies

```bash
yarn install
```

## ⚡ The Fuel Grants Program

The Fuel Grants Program is designed to support projects building on Fuel. It's offering generous grants to developers,
creators, and new or existing projects to build on the world's fastest modular execution layer.
[Read more here](https://fuel-labs.ghost.io/introducing-the-fuel-grants-program/)

## 📄 License

Redstone fuel connector is an open-source and free software released under the BUSL-1.1 License.
