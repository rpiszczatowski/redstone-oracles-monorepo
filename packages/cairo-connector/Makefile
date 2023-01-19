ACC=testac5
DATA_NAME=prices
PAYLOAD_URL=http://localhost:3000/data-packages/payload?data-feeds=ETH,BTC&unique-signers-count=2&data-service-id=redstone-avalanche-prod&format=
BTC=4346947
ETH=4543560
CONTRACT=price
MAX_FEE=1000000000000000
OWNER_ADDRESS=0x59db5a6dfad67ad1da7276f5ddc9ef0640a9f633f5dc2fc8a207bac3abb2108

BASE_PARAMS=1 5 0x12470f7aba85c8b81d63137dd5925d6ee114952b 0x109B4a318A4F5ddcbCA6349B45f881B4137deaFB 0x1ea62d73edf8ac05dfcea1a34b9796e937a29eff 0x2c59617248994D12816EE1Fa77CE0a64eEB456BF 0x83cba8c619fb629b81a65c2e67fe15cf3e3c9747

ifeq ($(CONTRACT), price)
CONSTRUCTOR_PARAMS=$(OWNER_ADDRESS) $(BASE_PARAMS)
else
CONSTRUCTOR_PARAMS=$(BASE_PARAMS)
endif

SRC=src/demo/main.cairo
OBJ=build/main_compiled.json
CNT=src/contracts/$(CONTRACT).cairo
CNC=build/$(CONTRACT)_compiled.json
ABI=build/$(CONTRACT)_abi.json
DATA_DIR=./data

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
	--class_hash $(CLASS_HASH) \
	--inputs $(CONSTRUCTOR_PARAMS)
#invoke: 'make CONTRACT_ADDRESS=0xabc get_oracle_values' or define the variable CONTRACT_ADDRESS above
get_oracle_values:
	starknet call --account=$(ACC) \
	--abi build/oracle_values_abi.json \
	--address ${CONTRACT_ADDRESS} \
	--function get_oracle_values \
	--inputs 2 $(BTC) $(ETH) $(shell (ls -lf $(DATA_DIR)/${DATA_NAME}.splitted | awk '{print $$5}' | awk '{print ($$1-1)/5}')) $(shell cat $(DATA_DIR)/${DATA_NAME}.splitted)

#invoke: 'make CONTRACT_ADDRESS=0xabc get_oracle_value' or define the variable CONTRACT_ADDRESS above
get_oracle_value:
	starknet call --account=$(ACC) \
	--abi build/oracle_values_abi.json \
	--address ${CONTRACT_ADDRESS} \
	--function get_oracle_value \
	--inputs $(BTC) $(shell (ls -lf $(DATA_DIR)/${DATA_NAME}.splitted | awk '{print $$5}' | awk '{print ($$1-1)/5}')) $(shell cat $(DATA_DIR)/${DATA_NAME}.splitted)

#invoke: 'make CONTRACT_ADDRESS=0xabc set_prices' or define the variable CONTRACT_ADDRESS above
set_prices:
	starknet invoke --account=$(ACC) \
	--abi build/price_abi.json \
	--address ${CONTRACT_ADDRESS} \
	--function set_prices \
	--inputs 2 $(BTC) $(ETH) $(shell (ls -lf $(DATA_DIR)/${DATA_NAME}.splitted | awk '{print $$5}' | awk '{print ($$1-1)/5}')) $(shell cat $(DATA_DIR)/${DATA_NAME}.splitted)

#invoke: 'make CONTRACT_ADDRESS=0xabc get_price' or define the variable CONTRACT_ADDRESS above
get_eth_price:
	starknet call --account=$(ACC) \
	--abi build/price_abi.json \
	--address ${CONTRACT_ADDRESS} \
	--function get_price \
	--inputs $(ETH) 

get_btc_price:
	starknet call --account=$(ACC) \
	--abi build/price_abi.json \
	--address ${CONTRACT_ADDRESS} \
	--function get_price \
	--inputs $(BTC) 

get_owner_and_caller:
	starknet call --account=$(ACC) \
	--abi build/price_abi.json \
	--address ${CONTRACT_ADDRESS} \
	--function get_owner_and_caller

clean:
	rm -rf build

prepare_data:
	curl "$(PAYLOAD_URL)hex" > $(DATA_DIR)/${DATA_NAME}.hex &
	curl "$(PAYLOAD_URL)json" | cut -c 2- | sed 's/\\"/"/g' | sed 's/.$$//g' > $(DATA_DIR)/${DATA_NAME}.json &
	curl "$(PAYLOAD_URL)bytes" > $(DATA_DIR)/${DATA_NAME}.tmp  

	printf '{"bytes":' > $(DATA_DIR)/${DATA_NAME}.input 
	cat $(DATA_DIR)/${DATA_NAME}.tmp >> $(DATA_DIR)/${DATA_NAME}.input 
	rm $(DATA_DIR)/${DATA_NAME}.tmp
	echo ',' >> $(DATA_DIR)/${DATA_NAME}.input 
	curl -L -H "Accept: application/json" unixtimesta.mp | cut -c 2- >> $(DATA_DIR)/${DATA_NAME}.input 
	cat $(DATA_DIR)/${DATA_NAME}.hex | fold -w2 | paste -sd' ' -  | sed -E 's/[[:space:]]+/ 0x/g' | cut -c 3- >> $(DATA_DIR)/${DATA_NAME}.input > $(DATA_DIR)/${DATA_NAME}.splitted


#You may have needed:
#	python3.9 -m venv /Users/lukaszkalbarczyk/cairo_venv
#	source /Users/lukaszkalbarczyk/cairo_venv/bin/activate
#	brew install gmp
#	pip3 install cairo-lang
#	pip3 install contextvars

#starknet:
#	export STARKNET_WALLET=starkware.starknet.wallets.open_zeppelin.OpenZeppelinAccount
#	export STARKNET_NETWORK=alpha-goerli
