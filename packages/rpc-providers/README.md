# Magic providers, compatible with ethers.Provider interface

**Tested only with JsonRpcProviders**

## ProviderWithFallback

1. Operations on events like {on,once,addListener etc.} are always run by the first provider in the providers array because they are stateful. However underlying operations are still executed with fallback logic. Thus we depend only on eventEmitter logic from the first provider.
2. If the provider fails on some operation new provider is elected.
3. If all providers fail on the same operation error is thrown.
4. When we switch to the next provider, all operations (excluding 1.) are executed by him till it fails, when it does -> 2.
5. Providers are elected by the sequence given in array. If array ends we start from the beginning.
