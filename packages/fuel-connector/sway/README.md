### Setting up the sway/Fuel environment

1. Install sway & fuel toolchain as described [here](https://fuellabs.github.io/sway/v0.35.5/book/introduction/installation.html) (the version `vx.y.z` may have changed)
   * The version `beta-3` of the toolchain should be chosen
   * The minimal version of the sway language (`forc` compiler) for `beta-3` (related to `fuel-core` in version `0.17.4`) network is `0.35.0` but the maximal for the `beta-2` is `0.34.0`
1. In case of troubles 
   1) the `sway` library 
      1) can be downloaded from [here](https://github.com/FuelLabs/sway) and the proper version-tag checked out
      1) then `cargo build` should be run (it's needed to have `cargo` installed)
      1) and the path exported by using for example: `export PATH="$HOME/Devel/sway/target/debug:$PATH"`
   1) the `fuel-core` 
      1) can be downloaded from [here](https://github.com/FuelLabs/fuel-core) and the proper version-tag checked out
      1) then `cargo xtask build` should be run (it's needed to have `cargo` installed)
      1) and the path exported by using for example: `export PATH="$HOME/Devel/fuel-core/target/debug:$PATH"`
1. You can use one of the nodes described [here-OUTDATED](http://fuelbook.fuel.network/master/networks/networks.html) or 
run a local Fuel node (with or without state persistence), as described [here](http://fuelbook.fuel.network/master/for-developers/running-a-local-node.html).
   1) in case of using the local network
      1) the default url of the local network is `http://127.0.0.1:4000` (`https` __without__ s ;p)
      1) no transaction needs to be signed (`--unsigned` should be used) 
      1) each transaction costs ETHs but the default accounts have ETH assets assigned
      1) the list of default accounts is displayed as one of first logs in the running network, for example: 
      ```(2023-03-15T12:52:14.257382Z  INFO fuel_core_chain_config::config::chain: 96: Initial Accounts```
      ```2023-03-15T12:52:14.262308Z  INFO fuel_core_chain_config::config::chain: 105: PrivateKey(0xabc), Address(0xdef [bech32: fuel01fc]), Balance(10000000)```
   1) in case of using the public node
      1) the url of the `beta-3` network is `https://beta-3.fuel.network/graphql`
      1) each transaction costs ETHs and must be signed by adding the account's private key 
         1) the value can be provided by setting the `SIGNING_KEY` variable in the [Makefile](Makefile) or during the invocation of particular methods: `make SIGNING_KEY=... run`
1. The wallet 
   1) can be created for example 
         1) by installing the chrome extension: https://wallet.fuel.network/docs/install/ (Firefox is not supported yet)
         1) by installing the [wallet plugin](https://github.com/FuelLabs/forc-wallet) for `forc` (`cargo install forc-wallet`) and then by using `forc-wallet new` command.
   1) once created works for all networks, but the ETH assets needed to be transferred to the particular network, __including__ the local network
      1) the faucet for `beta-3` network is <https://faucet-beta-3.fuel.network/>
      
### Running the sway demo program
1. check/fill the value with `PAYLOAD_URL` in the data-generator's [Makefile](./../data-generator/Makefile) (it should have the `format=` at the end). 
   * You might need the `cache-service` started locally and MongoDB installed or set up on the DigitalOcean <https://github.com/redstone-finance/redstone-oracles-monorepo/blob/main/.do/mongodb/README.md>.
1. execute `make prepare_data`. The files are saved in the `../../data-generator/data` directory
   * the base name of files is defined as `DATA_NAME` variable in the [Makefile](./../data-generator/Makefile) in the `/data-generator` directory
1. execute `make run` or `make SIGNING_KEY=... run`. The values returned by the program are available in logs, so you can use the `| grep "data"` pipe. 

### Using the contract
1. run `make deploy`/`make SIGNING_KEY=... deploy` and save the value of "contract id" hex returned by the function
   1. it's needed to fill the `CONTRACT_ID` variable in the [Makefile](Makefile) and in the following configuration files:
      1. [For contract initializer](sway/contract_initializer/Forc.toml)
      1. [For contract invoker](sway/contract_invoker/Forc.toml)
   1. NOTE:
      1. all time the `make deploy` is invoked for the unchanged code the contract gets the same contract id. 
      1. the contract cannot be re-deployed, so it's needed to change the value of `SALT` constant [here](sway/contract/Forc.toml) to have the contract deployed once-again.
1. There is no contract's constructor in sway, so it's needed to run `make init`/`make SIGNING_KEY=... init` to have the contract initialized.
1. The contract is available for use. You can check it by exploring the account [here](https://fuellabs.github.io/block-explorer-v2/beta-3/)
1. run `make invoke` to save example values to the contract and then read it.
   1. also it's worth to use the `| grep "data"` pipe.
   1. there are no other possibilities of invoking the contract but scripts, so see/modify the script in the [main.sw](sway/contract_invoker/src/main.sw) file.

#### See [here](contract/README.md) how the contracts work 
