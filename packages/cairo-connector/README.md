1) Setting up the environment
* installing cairo & starting inside a python env: https://www.cairo-lang.org/docs/quickstart.html
* installing starknet CLI & setting up the account: https://www.cairo-lang.org/docs/hello_starknet/account_setup.html
* remember to transfer Goerli ETH by using https://faucet.goerli.starknet.io/ as defined in the tutorial
* wait to have the transaction accepted on L2 (check it on https://testnet.starkscan.co/)
* then fill the value variable ACC in the Makefile (the default account name is "__default __" _without the space-character inside_) 
    by putting there a value of the --account if you have passed it to `starknet new_account`

2) Running the cairo sample program
* fill the value with PAYLOAD_URL in the Makefile (it should have the format= at the end)
* execute `make prepare_data`. The files are saved in the ./data directory; the base name is defined as DATA_NAME variable in the Makefile)
* execute `make run`

3) Using the contract
* run `make declare` and save the value of "class hash" hex returned by the function
* wait to have the transaction accepted on L2 (check it on https://testnet.starkscan.co/)
* run `make CLASS_HASH=0xabc deploy` where 0xabc is the "class hash" saved in the first step and save the "contract hash".
* wait to have the transaction accepted on L2
* run `make prepare_data` once again to have the data's timestamp able to validate by the contract
* run `make CONTRACT_ADDRESS=0xdef get_oracle_value(s)` where 0xdef is the "contract hash" saved in the deploying-step above.
* you can modify the invocation and/or DATA_NAME directly in the Makefile
