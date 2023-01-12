# 🔗 redstone-eth-contracts

[![Discord](https://img.shields.io/discord/786251205008949258?logo=discord)](https://discord.gg/2CT6hN6C)
[![Twitter](https://img.shields.io/twitter/follow/redstone_defi?style=flat&logo=twitter)](https://twitter.com/intent/follow?screen_name=limestone_defi)

This subproject contains an implementation of the main RedStone contracts with the business logic for its data providers and dispute resolutions.

## Contracts

### RedstoneToken.sol

A standard implementation of ERC20 token with ability to mint more tokens by the authorised minter. Minter role can be passed to another address by the existing minter. There is no limit for max token supply.

This contract is not upgradable, as we (the RedStone team) don't want to be able to change its logic.

### LockingRegistry.sol

This contract contains the logic of the RedStone tokens locking.

#### Locking tokens

Data providers need to lock a specified amount of RedStone tokens (using the `lock(uint256 amountToLock)` method) in order to join RedStone oracle services and start receiving rewards for providing data.

#### Unlocking tokens

If the data provider would like to stop providing services with RedStone oracles, they can unlock the tokens. Firstly, they need to call the `requestUnlock(uint256 amountToUnlock)` method. Then, after waiting for `delayForUnlockingInSeconds` (will be set to 30 days) they can withdraw the locked tokens using the `completeUnlock()` method.

The waiting period is added so that RedStone consumers have enough time to remove the data provider address from their contracts. During the waiting period the data provider' tokens can still be slashed, which should motivate them to provide correct data during the waiting period (probably receiveing less rewards).

There is a possibility that a data provider is not able to complete unlock if some of its amount was slashed during the waiting period. In this case, they need to call the `requestUnlock` again.

#### Slashing

The LockingRegistry contract has a mechanism of slashing (`slash(address slashedAddress, uint256 slashedAmount)` method), which can be performed only by a special authorised address (authorised slasher address). The authorised slasher can slash any amount from any user that locked their funds. This mechanism is created to "punish" misbehaved data providers.

Initially, we'll specify the RedStone team multisig wallet as the authorised slasher. In future the DisputeResolutionContract will become the authorised slasher and it will be able to slash tokens automatically after the dispute settlement.

This contract is upgradable.

### VestingWallet.sol

TODO - describe the vesting wallet functions and ideas.

This contract is upgradable.

### DisputeResolutionEngine.sol

This contract contains all the complex logic of disputes resolution. But it will be audited and deployed in longer future.

## Deployment

- Create a `.env` file with your PRIVATE_KEY and GOERLI_URL
- Install dependencies using `yarn install`
- Run `npx hardhat run src/deploy-all.ts --network goerli`

## License

BUSL-1.1
