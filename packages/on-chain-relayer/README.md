# On-chain relayer

[![License](https://img.shields.io/badge/license-MIT-green)](https://choosealicense.com/licenses/mit/)
[![Discord](https://img.shields.io/discord/786251205008949258?logo=discord)](https://discord.gg/2CT6hN6C)
[![Twitter](https://img.shields.io/twitter/follow/redstone_defi?style=flat&logo=twitter)](https://twitter.com/intent/follow?screen_name=redstone_defi)

On-chain relayer is designed for pushing price data to price feeds which implement Chainlink [AggregatorV3Interface](https://github.com/smartcontractkit/chainlink/blob/develop/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol). This could help different protocols quickly switch to RedStone Oracles without the need to change the codebase. On-chain relayer consists of two main parts, the first one is the [relayer](#relayer) responsible for pushing data to the contract in a customized way using [environment variables](#environment-variables). The second part is [contracts](#contracts) which enable storing prices on-chain and getting them through the Chainlink interface.

## Relayer

Relayer is a Node.js application which works in a customizable way based on [environment variables](#environment-variables). The main responsibility is to check if certain conditions are met and, if so, to update the prices of the price feeds. Currently, two conditions are implemented. The first one is `time` which describes how often prices should be updated. It is defined by the `UPDATE_PRICE_INTERVAL` environment and is defined in milliseconds. The second condition is `value-deviation` which indicates how much value should change in order to update prices. It is described by the `MIN_DEVIATION_PERCENTAGE` environment variable. If multiple conditions are passed to the `UPDATE_CONDITIONS` relayer will work in the manner that if any conditions are met then prices would be updated.

## Contracts

In order to make on-chain relayer works at least two contracts need to be deployed.
The first one is the [PriceFeedsAdapter](./contracts/price-feeds/PriceFeedsAdapter.sol) which is responsible for:

- storing all price feeds symbols (references as dataFeedId which is consistent with RedStone dataFeedId),
- storing price feeds values,
- updating price feeds values in batch,
- storing information regarding the round number and timestamp of the last update,
- getting prices for multiple feeds values in batch.

The second contract required is [PriceFeed](./contracts/price-feeds/PriceFeed.sol). There could be multiple price feeds on the single blockchain with different price feeds symbols (references as dataFeedId which is consistent with RedStone dataFeedId). Price feed is an interface for getting price feed values which are stored in `PriceFeedsAdapter` contract using Chainlink [AggregatorV3Interface](https://github.com/smartcontractkit/chainlink/blob/develop/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol).

## Environment variables

| Variable                   | Description                                                                                                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RELAYER_ITERATION_INTERVAL | Time interval in which the relayer tries to update prices                                                                                                                                                                                   |
| UPDATE_CONDITIONS          | Array of parameters which describes what decides if prices can be updated, currently acceptable parameters are 'time' and 'value-deviation'                                                                                                 |
| UPDATE_PRICE_INTERVAL      | Time interval which describes how often prices should be updated if UPDATE_CONDITIONS contains "time" parameter                                                                                                                             |
| MIN_DEVIATION_PERCENTAGE   | Minimum deviation of the prices which triggers prices update if UPDATE_CONDITIONS contains "value-deviation"                                                                                                                                |
| RPC_URL                    | URL of RPC for interaction with blockchain                                                                                                                                                                                                  |
| CHAIN_NAME                 | Chain name of the blockchain relayer should work on                                                                                                                                                                                         |
| CHAIN_ID                   | Chain id of the blockchain relayer should work on                                                                                                                                                                                           |
| PRIVATE_KEY                | Private key of the wallet with funds on a proper network to push prices to the price feed contract                                                                                                                                          |
| ADAPTER_CONTRACT_ADDRESS   | Address of the adapter contract deployed on a proper network                                                                                                                                                                                |
| DATA_SERVICE_ID            | RedStone Wrapper parameter which describes what data services should be used to fetch the price, more can be found [here](https://docs.redstone.finance/docs/smart-contract-devs/getting-started#2-adjust-javascript-code-of-your-dapp)     |
| UNIQUE_SIGNERS_COUNT       | RedStone Wrapper parameter which describes how many unique signer should sign price data, more can be found [here](https://docs.redstone.finance/docs/smart-contract-devs/getting-started#2-adjust-javascript-code-of-your-dapp)            |
| DATA_FEEDS                 | RedStone Wrapper parameter which describes what tokens will be used, more can be found [here](https://docs.redstone.finance/docs/smart-contract-devs/getting-started#2-adjust-javascript-code-of-your-dapp)                                 |
| CACHE_SERVICE_URLS         | RedStone Wrapper parameter which describes what cache services URLs will be used to fetch the price, more can be found [here](https://docs.redstone.finance/docs/smart-contract-devs/getting-started#2-adjust-javascript-code-of-your-dapp) |
| GAS_LIMIT                  | Gas limit used to push data to the price feed contract                                                                                                                                                                                      |

Examples of environment variables already working can be found [here](./deployed-config/).
