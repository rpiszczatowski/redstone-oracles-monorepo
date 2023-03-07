ACC=showroom
DATA_NAME=test

#BASE_PARAMS=1 5 0x12470f7aba85c8b81d63137dd5925d6ee114952b 0x109B4a318A4F5ddcbCA6349B45f881B4137deaFB 0x1ea62d73edf8ac05dfcea1a34b9796e937a29eff 0x2c59617248994D12816EE1Fa77CE0a64eEB456BF 0x83cba8c619fb629b81a65c2e67fe15cf3e3c9747
BASE_PARAMS=1 1 1413123745572547900128493490517406887815334304489 #0xf786a909D559F5Dee2dc6706d8e5A81728a39aE9

CONTRACT=prices
IS_OWNABLE=0
OWNER_ADDRESS=0x6261872042c207b8efd92328568b7ff0649d219714803566fbf9eb59d4c7a3a

ifeq ($(IS_OWNABLE), 1)
CONSTRUCTOR_PARAMS=$(OWNER_ADDRESS) $(BASE_PARAMS)
else
CONSTRUCTOR_PARAMS=$(BASE_PARAMS)
endif

BTC=4346947
ETH=4543560

MAX_FEE=2000000000000000
SRC=src/demo/main.cairo
OBJ=build/main_compiled.json
CNT=src/contracts/$(CONTRACT).cairo
CNC=build/$(CONTRACT)_compiled.json
ABI=build/$(CONTRACT)_abi.json
DATA_DIR=../data-generator/data

SHELL := /bin/bash

format:
	protostar format src test

build_dir:
	mkdir -p build

compile: format build_dir
	cairo-compile $(SRC) --output $(OBJ) --cairo_path=src

run: compile
	cairo-run --program=$(OBJ) --print_output --layout=perpetual_with_bitwise \
	--program_input=$(DATA_DIR)/${DATA_NAME}.input \
	--print_info

tests: format
	protostar test test --cairo-path=src

contract: format build_dir
	starknet-compile $(CNT) \
        --output $(CNC) \
        --abi $(ABI) --cairo_path=src

contracts: format build_dir
	protostar build  --cairo-path=src

declare: $(CNC)
	starknet declare --account=$(ACC) --contract $(CNC) --max_fee=$(MAX_FEE) \
	--wallet=starkware.starknet.wallets.open_zeppelin.OpenZeppelinAccount \
	--network=alpha-goerli

$(CNC): contract
$(ABI): contract

#invoke: 'make CLASS_HASH=0xabc deploy' or define the variable CLASS_HASH above
deploy:
	starknet deploy --account=$(ACC) --max_fee=$(MAX_FEE) \
	--wallet=starkware.starknet.wallets.open_zeppelin.OpenZeppelinAccount \
	--network=alpha-goerli \
	--class_hash $(CLASS_HASH) \
	--inputs $(CONSTRUCTOR_PARAMS)

#invoke: 'make CONTRACT_ADDRESS=0xabc get_prices' or define the variable CONTRACT_ADDRESS above
get_prices:
	starknet call --account=$(ACC) \
	--abi $(ABI) \
	--address ${CONTRACT_ADDRESS} \
	--function get_prices \
	--inputs 2 $(BTC) $(ETH) $(shell (ls -lf $(DATA_DIR)/${DATA_NAME}.splitted | awk '{print $$5}' | awk '{print ($$1-1)/5}')) $(shell cat $(DATA_DIR)/${DATA_NAME}.splitted)

#invoke: 'make CONTRACT_ADDRESS=0xabc get_price' or define the variable CONTRACT_ADDRESS above
get_btc_price:
	starknet call --account=$(ACC) \
	--abi $(ABI) \
	--address ${CONTRACT_ADDRESS} \
	--function get_price \
	--inputs $(BTC) $(shell (ls -lf $(DATA_DIR)/${DATA_NAME}.splitted | awk '{print $$5}' | awk '{print ($$1-1)/5}')) $(shell cat $(DATA_DIR)/${DATA_NAME}.splitted)

#invoke: 'make CONTRACT_ADDRESS=0xabc save_prices' or define the variable CONTRACT_ADDRESS above
save_prices:
	starknet invoke --account=$(ACC) \
	--abi $(ABI) \
	--address ${CONTRACT_ADDRESS} \
	--function save_prices \
	--inputs 1 $(ETH) $(shell (ls -lf $(DATA_DIR)/${DATA_NAME}.splitted | awk '{print $$5}' | awk '{print ($$1-1)/5}')) $(shell cat $(DATA_DIR)/${DATA_NAME}.splitted)

#invoke: 'make CONTRACT_ADDRESS=0xabc get_saved_prices' or define the variable CONTRACT_ADDRESS above
get_saved_prices:
	starknet call --account=$(ACC) \
	--abi $(ABI) \
	--address ${CONTRACT_ADDRESS} \
	--function get_saved_prices \
	--inputs 2 $(ETH) $(BTC)


#invoke: 'make CONTRACT_ADDRESS=0xabc get_saved_eth_price' or define the variable CONTRACT_ADDRESS above
get_saved_eth_price:
	starknet call --account=$(ACC) \
	--abi $(ABI) \
	--address ${CONTRACT_ADDRESS} \
	--function get_saved_price \
	--inputs $(ETH)

#invoke: 'make CONTRACT_ADDRESS=0xabc get_saved_btc_price' or define the variable CONTRACT_ADDRESS above
get_saved_btc_price:
	starknet call --account=$(ACC) \
	--abi $(ABI) \
	--address ${CONTRACT_ADDRESS} \
	--function get_saved_price \
	--inputs $(BTC) 

#invoke: 'make CONTRACT_ADDRESS=0xabc get_timestamp' or define the variable CONTRACT_ADDRESS above
get_saved_timestamp:
	starknet call --account=$(ACC) \
	--abi $(ABI) \
	--address ${CONTRACT_ADDRESS} \
	--function get_saved_timestamp \

clean:
	rm -rf build

prepare_data:
	make -C ../data-generator DATA_NAME=$(DATA_NAME) prepare_data

#You may have needed:
#	python3.9 -m venv /Users/lukaszkalbarczyk/cairo_venv
#	source /Users/lukaszkalbarczyk/cairo_venv/bin/activate
#	brew install gmp
#	pip3 install cairo-lang
#	pip3 install contextvars

#starknet:
#	export STARKNET_WALLET=starkware.starknet.wallets.open_zeppelin.OpenZeppelinAccount
#	export STARKNET_NETWORK=alpha-goerli
