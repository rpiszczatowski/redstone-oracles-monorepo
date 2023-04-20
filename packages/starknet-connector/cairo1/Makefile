ACC=devnet
NETWORK=alpha-goerli
OWNER_ADDRESS=0x03637844cecacd9c9ec0077c03e16c7fa389087e05a4aa4b98359ac826a18567

DATA_NAME=test

#BASE_PARAMS=1 5 0x12470f7aba85c8b81d63137dd5925d6ee114952b 0x109B4a318A4F5ddcbCA6349B45f881B4137deaFB 0x1ea62d73edf8ac05dfcea1a34b9796e937a29eff 0x2c59617248994D12816EE1Fa77CE0a64eEB456BF 0x83cba8c619fb629b81a65c2e67fe15cf3e3c9747
#BASE_PARAMS=1 1 1413123745572547900128493490517406887815334304489 #0xf786a909D559F5Dee2dc6706d8e5A81728a39aE9

MANAGER_ADDRESS=0x05e66a79b94184768f8f629ed7d3bb8314e41765a346bd6c57f8d2e72258e0fc

CONTRACT=price_feed
IS_OWNABLE=0
IS_CONSUMER=1

BTC=4346947
ETH=4543560

MAX_FEE=6000000000000000
ifeq ($(IS_OWNABLE), 1)
	CONSTRUCTOR_PARAMS=$(OWNER_ADDRESS) $(BASE_PARAMS)
else
	ifeq ($(IS_CONSUMER), 1)
		CONSTRUCTOR_PARAMS=$(MANAGER_ADDRESS) $(ETH)
	else
		CONSTRUCTOR_PARAMS=$(BASE_PARAMS)
	endif
endif

SRC=src
TEST=test
OBJ=build/main_compiled.sierra
CNT=$(SRC)/contracts/$(CONTRACT)/
CNC=build/$(CONTRACT)_compiled.json
ABI=build/$(CONTRACT)_abi.json
DATA_DIR=../../protocol/scripts/payload-generator/data

SHELL := /bin/bash

BIN=/Users/lukaszkalbarczyk/Devel/cairo/target/release/
STARKNET_PARAMS=--account=$(ACC) --network=$(NETWORK) \
	--gateway_url=http://127.0.0.1:5050 --feeder_gateway_url=http://127.0.0.1:5050 \
	--wallet=starkware.starknet.wallets.open_zeppelin.OpenZeppelinAccount \

format:
	$(BIN)cairo-format -p -r $(SRC)/contracts

build_dir:
	mkdir -p build

compile: format build_dir
	$(BIN)cairo-compile --replace-ids $(SRC)/demo $(OBJ) 

run: format
	$(BIN)cairo-run --available-gas=200000000 $(SRC)/demo

tests: format
	$(BIN)cairo-test $(TEST)

contract: format build_dir
	$(BIN)starknet-compile --replace-ids --allowed-libfuncs-list-name=experimental_v0.1.0 $(CNT) $(CNC)

contracts: format build_dir
	protostar build  --cairo-path=$(SRC)

new_account:
	starknet new_account $(STARKNET_PARAMS)

deploy_account:
	starknet deploy_account --force $(STARKNET_PARAMS)

declare: $(CNC)
	starknet declare $(STARKNET_PARAMS) --contract $(CNC) --max_fee=$(MAX_FEE) \
	--compiler_dir=$(BIN)
# --compiler_args="allowed-libfuncs-list-name=experimental_v0.1.0" \

$(CNC): contract
$(ABI): contract

#invoke: 'make CLASS_HASH=0xabc deploy' or define the variable CLASS_HASH above
deploy:
	starknet deploy $(STARKNET_PARAMS) \
	--class_hash $(CLASS_HASH) \
	--inputs $(CONSTRUCTOR_PARAMS)

#invoke: 'make CONTRACT_ADDRESS=0xabc get_prices' or define the variable CONTRACT_ADDRESS above
get_prices:
	starknet call --account=$(ACC) --network=$(NETWORK) \
	--abi $(ABI) \
	--address ${CONTRACT_ADDRESS} \
	--function get_prices \
	--inputs 2 $(BTC) $(ETH) $(shell (ls -lf $(DATA_DIR)/${DATA_NAME}.splitted | awk '{print $$5}' | awk '{print ($$1-1)/5}')) $(shell cat $(DATA_DIR)/${DATA_NAME}.splitted)

#invoke: 'make CONTRACT_ADDRESS=0xabc get_price' or define the variable CONTRACT_ADDRESS above
get_btc_price:
	starknet call --account=$(ACC) --network=$(NETWORK) \
	--abi $(ABI) \
	--address ${CONTRACT_ADDRESS} \
	--function get_price \
	--inputs $(BTC) $(shell (ls -lf $(DATA_DIR)/${DATA_NAME}.splitted | awk '{print $$5}' | awk '{print ($$1-1)/5}')) $(shell cat $(DATA_DIR)/${DATA_NAME}.splitted)

#invoke: 'make CONTRACT_ADDRESS=0xabc save_prices' or define the variable CONTRACT_ADDRESS above
save_prices:
	starknet invoke --account=$(ACC) --network=$(NETWORK) \
	--abi $(ABI) \
	--address ${CONTRACT_ADDRESS} \
	--function save_prices \
	--inputs 1 $(ETH) $(shell (ls -lf $(DATA_DIR)/${DATA_NAME}.splitted | awk '{print $$5}' | awk '{print ($$1-1)/5}')) $(shell cat $(DATA_DIR)/${DATA_NAME}.splitted)

#invoke: 'make CONTRACT_ADDRESS=0xabc get_saved_prices' or define the variable CONTRACT_ADDRESS above
get_saved_prices:
	starknet call --account=$(ACC) --network=$(NETWORK) \
	--abi $(ABI) \
	--address ${CONTRACT_ADDRESS} \
	--function get_saved_prices \
	--inputs 2 $(ETH) $(BTC)


#invoke: 'make CONTRACT_ADDRESS=0xabc get_saved_eth_price' or define the variable CONTRACT_ADDRESS above
get_saved_eth_price:
	starknet call --account=$(ACC) --network=$(NETWORK) \
	--abi $(ABI) \
	--address ${CONTRACT_ADDRESS} \
	--function get_saved_price \
	--inputs $(ETH)

#invoke: 'make CONTRACT_ADDRESS=0xabc get_saved_btc_price' or define the variable CONTRACT_ADDRESS above
get_saved_btc_price:
	starknet call --account=$(ACC) --network=$(NETWORK) \
	--abi $(ABI) \
	--address ${CONTRACT_ADDRESS} \
	--function get_saved_price \
	--inputs $(BTC) 

#invoke: 'make CONTRACT_ADDRESS=0xabc get_timestamp' or define the variable CONTRACT_ADDRESS above
get_saved_timestamp:
	starknet call --account=$(ACC) --network=$(NETWORK) \
	--abi $(ABI) \
	--address ${CONTRACT_ADDRESS} \
	--function get_saved_timestamp 

read_timestamp_and_round: 
	starknet call --account=$(ACC) --network=$(NETWORK) \
	--abi $(ABI) \
	--address ${CONTRACT_ADDRESS} \
	--function read_timestamp_and_round 

read_eth_price:
	starknet call --account=$(ACC) --network=$(NETWORK) \
	--abi $(ABI) \
	--address ${CONTRACT_ADDRESS} \
	--function read_eth_price 

write_eth_price:
	starknet invoke --account=$(ACC) --network=$(NETWORK) \
	--abi $(ABI) \
	--address ${CONTRACT_ADDRESS} \
	--function write_eth_price \
	--inputs $(shell (ls -lf $(DATA_DIR)/${DATA_NAME}.splitted | awk '{print $$5}' | awk '{print ($$1-1)/5}')) $(shell cat $(DATA_DIR)/${DATA_NAME}.splitted)

latest_round_data: 
	starknet call $(STARKNET_PARAMS) \
	--address ${CONTRACT_ADDRESS} \
	--function latest_round_data 

write_prices:
	starknet invoke --account=$(ACC) --network=$(NETWORK) \
	--wallet=starkware.starknet.wallets.open_zeppelin.OpenZeppelinAccount \
	--address ${CONTRACT_ADDRESS} \
	--function write_prices \
	--inputs 1 2 $(ETH) $(BTC) 2 1255 5421 5463334

clean:
	rm -rf build

prepare_data:
	make -C ../../protocol/scripts/payload-generator DATA_NAME=$(DATA_NAME) prepare_data
	cp ../../protocol/scripts/payload-generator/data/$(DATA_NAME).cairo src/demo/$(DATA_NAME).cairo
#You may have needed:
#	python3.9 -m venv /Users/lukaszkalbarczyk/cairo_venv
#	source /Users/lukaszkalbarczyk/cairo_venv/bin/activate
#	brew install gmp
#	pip3 install cairo-lang
#	pip3 install contextvars

#starknet:
#	export STARKNET_WALLET=starkware.starknet.wallets.open_zeppelin.OpenZeppelinAccount
#	export STARKNET_NETWORK=alpha-goerli

# mint:
#    curl localhost:5050/mint -H "Content-Type: application/json" -d "{ \"address\": \"0x03637844cecacd9c9ec0077c03e16c7fa389087e05a4aa4b98359ac826a18567\", \"amount\": 1000000000000000000, \"lite\": false }"