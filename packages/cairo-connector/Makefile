SRC=main.cairo
OBJ=main_compiled.json
CNT=contract.cairo
CNC=contract_compiled.json
ABI=contract_abi.json
MAX_FEE=1000000000000000
DATA_DIR=./data

ACC=__default__
DATA_NAME=payload_3sig
PAYLOAD_URL=http://localhost:3000/data-packages/payload?unique-signers-count=3&data-service-id=redstone-avalanche-prod&format=
BTC=4346947
ETH=4543560

SHELL := /bin/bash

format:
	cairo-format --one_item_per_line -i *.cairo **/**/*.cairo  # **/*.cairo

compile: format
	cairo-compile $(SRC) --output $(OBJ) --cairo_path="/"

run: $(OBJ)
	cairo-run --program=$(OBJ) --print_output --layout=perpetual_with_bitwise \
	--program_input=$(DATA_DIR)/${DATA_NAME}.input \
	--print_info

$(OBJ): compile

contract: format
	starknet-compile $(CNT) \
        --output $(CNC) \
        --abi $(ABI) --cairo_path="/"

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
	--inputs 1 5 0x12470f7aba85c8b81d63137dd5925d6ee114952b 0x109B4a318A4F5ddcbCA6349B45f881B4137deaFB 0x1ea62d73edf8ac05dfcea1a34b9796e937a29eff 0x2c59617248994D12816EE1Fa77CE0a64eEB456BF 0x83cba8c619fb629b81a65c2e67fe15cf3e3c9747

#invoke: 'make CONTRACT_ADDRESS=0xabc get_oracle_values' or define the variable CONTRACT_ADDRESS above
get_oracle_values:
	starknet call --account=$(ACC) \
	--abi $(ABI) \
	--address ${CONTRACT_ADDRESS} \
	--function get_oracle_values \
	--inputs 2 $(BTC) $(ETH) $(shell (ls -lf $(DATA_DIR)/${DATA_NAME}.splitted | awk '{print  $$5}' | awk '{print ($$1-1)/5}')) $(shell cat $(DATA_DIR)/${DATA_NAME}.splitted)

#invoke: 'make CONTRACT_ADDRESS=0xabc get_oracle_value' or define the variable CONTRACT_ADDRESS above
get_oracle_value:
	starknet call --account=$(ACC) \
	--abi $(ABI) \
	--address ${CONTRACT_ADDRESS} \
	--function get_oracle_value \
	--inputs $(BTC) $(shell (ls -lf $(DATA_DIR)/${DATA_NAME}.splitted | awk '{print  $$5}' | awk '{print ($$1-1)/5}')) $(shell cat $(DATA_DIR)/${DATA_NAME}.splitted)

clean:
	rm $(OBJ) $(CNC) $(ABI)

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
