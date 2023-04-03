1. If we lower uniqueSignersCount in price adapter contract and don't update configuration on relayes.
   Packages will be filtered out and prices won't be updated, to avoid that we could fetch uniqueSignerTrehold from contract.
2. In contracts like `PriceFeedsAdapter` we could use uint64 for timestamps instead of uint256.
3.
