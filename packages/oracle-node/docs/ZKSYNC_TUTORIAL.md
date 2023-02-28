# Using RedStone oracles on zkSync

By the end of this tutorial you will understand how to integrate your dApp built on zkSync with RedStone oracles.

This document will cover:

- What is RedStone?
- How to use RedStone?
- Examples

## 🚀 What is RedStone?

RedStone is a data ecosystem that delivers frequently updated, reliable and diverse data for your dApps and smart contracts.

It uses a radically different way of putting oracle data on-chain:

- RedStone data providers need to sign provided data and broadcast it using the decentralized [Streamr](https://streamr.network/) pub-sub network. Providers **don't need to push the data on-chain**, which allows them to provide way **more types of data** with significantly **higher update frequency**
- End users can receive signed oracle data from the Streamr network and self-deliver it on-chain, attaching it to their transactions
- On-chain Smart Contracts can verify the data integrity using cryptographic signatures and timestamps

Additionally, RedStone:

- Uses token incentives to motivate data providers to maintain data integrity and uninterrupted service
- Leverages [Arweave blockchain](https://www.arweave.org/) as a cheap and permanent decentralized storage for archiving Oracle data and maintaining data providers' accountability

To learn more about RedStone oracles design check out the [RedStone docs.](https://docs.redstone.finance/docs/introduction)

## 📈 What data is available

Thanks to our innovative architecture, we offer more than one thousand of pricing data feeds, including tokens, stocks, ETFs, commodities, and much more for a fraction of regular Oracles integration costs.

You can check available assets and data providers using [app.redstone.finance.](https://app.redstone.finance/)

## 🔥 How to use RedStone?

**IMPORTANT**: Please reach out to the RedStone team [on Discord](https://redstone.finance/discord) before using RedStone oracles in production dApps. We will be happy to help you with the integration and will set up a new pool of data provider nodes if there is a need.

### Installation

Install [@redstone-finance/evm-connector](https://www.npmjs.com/package/@redstone-finance/evm-connector) from NPM registry

```bash
# Using yarn
yarn add @redstone-finance/evm-connector

# Using NPM
npm install @redstone-finance/evm-connector
```

### Usage


TLDR; You need to do 2 things:

1. [Adjust your smart contracts](#1-adjust-your-smart-contracts)
2. [Adjust Javascript code of your dApp](#2-adjust-javascript-code-of-your-dapp) (**it is required**, otherwise you will get smart contract errors)

💡 Note: Please don't use Remix to test RedStone oracles, as Remix does not support modifying transactions in the way that the evm-connector does.

### 1. Adjust your smart contracts

You need to apply a minimum change to the source code to enable smart contract to access data. Your contract needs to extend one of our custom base contracts, which can be found [here.](https://github.com/redstone-finance/redstone-oracles-monorepo/tree/main/packages/evm-connector/contracts/data-services)

We strongly recommend having some upgradability mechanism for your contracts (it can be based on multisig, DAO, or anything else). This way, you can quickly switch to the latest trusted data providers in case of changes or problems with the current providers.

```js
import "@redstone-finance/evm-connector/contracts/data-services/MainDemoConsumerBase.sol";

contract YourContractName is MainDemoConsumerBase {
  ...
}
```

After applying the mentioned change you will be able to access the data calling the local `getOracleNumericValueFromTxMsg` function. You should pass the data feed id converted to `bytes32`.

```js
// Getting a single value
uint256 ethPrice = getOracleNumericValueFromTxMsg(bytes32("ETH"));

// Getting several values
bytes32[] memory dataFeedIds = new bytes32[](2);
dataFeedIds[0] = bytes32("ETH");
dataFeedIds[1] = bytes32("BTC");
uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);
uint256 ethPrice = values[0];
uint256 btcPrice = values[1];
```

You can see all available data feeds [in our web app.](https://app.redstone.finance)

### 2. Adjust Javascript code of your dApp

You should also update the code responsible for submitting transactions. If you're using [ethers.js](https://github.com/ethers-io/ethers.js/), we've prepared a dedicated library to make the transition seamless.

#### Contract object wrapping

First, you need to import the wrapper code to your project

```ts
// Typescript
import { WrapperBuilder } from "@redstone-finance/evm-connector";

// Javascript
const { WrapperBuilder } = require("@redstone-finance/evm-connector");
```

Then you can wrap your ethers contract pointing to the selected [Redstone data service id.](https://api.redstone.finance/providers) You should also specify a number of unique signers, data feed identifiers, and (optionally) URLs for the redstone cache nodes.

```js
const yourEthersContract = new ethers.Contract(address, abi, provider);

// Connecting all provider's prices (consumes more GAS)
const wrappedContract = WrapperBuilder.wrap(contract).usingDataService(
  {
    dataServiceId: "redstone-main-demo",
    uniqueSignersCount: 1,
    dataFeeds: ["ETH", "BTC"],
  },
  ["https://d33trozg86ya9x.cloudfront.net"]
);
```

Now you can access any of the contract's methods in exactly the same way as interacting with the ethers-js code:

```js
wrappedContract.executeYourMethod();
```

#### Mock provider

If you'd like to use the wrapper in a test context, we recommend using a mock wrapper so that you can easily override the oracle values to test different scenarios. To use the mock wrapper just use the `usingMockData(signedDataPackages)` function instead of the `usingDataService` function. You can see examples of the mock wrapper usage [here.](https://github.com/redstone-finance/redstone-oracles-monorepo/tree/main/packages/evm-connector/test/mock-wrapper)

You can find more information in the [RedStone documentation](https://docs.redstone.finance/docs/smart-contract-devs/getting-started) to learn how to integrate your zkSync dApp with RedStone oracles.

## 🌎 Useful links

- [Repo with examples](https://github.com/redstone-finance/redstone-evm-examples)
- [RedStone Documentation](https://docs.redstone.finance/)
- [RedStone Price Feeds](https://docs.redstone.finance/docs/smart-contract-devs/price-feeds)
- [Data from any URL](https://docs.redstone.finance/docs/smart-contract-devs/custom-urls)
- [NFT Data Feeds](https://docs.redstone.finance/docs/smart-contract-devs/nft-data-feeds)
- [Randomness](https://docs.redstone.finance/docs/smart-contract-devs/randomness)

## 🙋‍♂️ Need help?

Please feel free to contact the RedStone team [on Discord](https://redstone.finance/discord) if you have any questions.
