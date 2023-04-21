# Magic providers, compatible with ethers.Provider interface

**Tested only with JsonRpcProviders**

## ProviderWithFallback

1. If the provider fails on some operation new provider is elected.
2. If all providers fail on the same operation error is thrown.
3. When we switch to the next provider, all operations (excluding 1.) are executed by him till it fails, when it does ->
4. Providers are elected by the sequence given in array. If array ends we start from the beginning.

## ProviderWithAgreement

1. Works like `ProviderWithFallback, with an exception for two methods.
2. `getBlockNumber` asks all providers for blockNumber and then picks `blockNumber.sort(ASC)[1]`
3. `call` ask all providers for result
   - if at least `N` answers are the same return call result
   - ignore all errors
   - as soon as he will receive two matching responses return. (doesn't wait for the rest of providers to finish)
