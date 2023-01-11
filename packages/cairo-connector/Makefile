SRC=main.cairo
OBJ=main_compiled.json
CNT=contract.cairo
CNC=contract_compiled.json
ABI=contract_abi.json
ACC=testac5
MAX_FEE=915193871434328
DATA_DIR=./data
PAYLOAD_URL=http://localhost:3000/data-packages/payload\?unique-signers-count\=1\&data-service-id\=redstone-avalanche-prod\&format\=

SHELL := /bin/bash

format:
	cairo-format --one_item_per_line -i *.cairo **/*.cairo **/**/*.cairo

compile: format
	cairo-compile $(SRC) --output $(OBJ) --cairo_path="/"

run: $(OBJ)
	cairo-run --program=$(OBJ) --print_output --layout=perpetual_with_bitwise --program_input=$(DATA_DIR)/payload.bytes \
	--print_info

$(OBJ): compile

contract: format
	starknet-compile $(CNT) \
        --output $(CNC) \
        --abi $(ABI) --cairo_path="/"

declare: $(CNC)
	starknet declare --account=$(ACC) --contract $(CNC) \
	--wallet=starkware.starknet.wallets.open_zeppelin.OpenZeppelinAccount \
	--network=alpha-goerli

$(CNC): contract
$(ABI): contract

deploy:
	starknet deploy --account=$(ACC) --class_hash $(CLASS_HASH) --max_fee=$(MAX_FEE) --inputs 2 555 0x109B4a318A4F5ddcbCA6349B45f881B4137deaFB

process_payload:
	starknet invoke --account=$(ACC) \
	--address ${CONTRACT_ADDRESS} \
	--abi $(ABI) \
	--function process_payload \
	--max_fee=$(MAX_FEE) \
	--inputs 2140 $(shell cat $(DATA_DIR)/payload.splitted)

get_btc_price:
	starknet call --account=$(ACC) \
	--address ${CONTRACT_ADDRESS} \
	--abi $(ABI) \
	--function get_btc_price

get_signer_addresses:
	starknet call --account=$(ACC) \
	--address ${CONTRACT_ADDRESS} \
	--abi $(ABI) \
	--function get_signer_addresses

clean:
	rm $(OBJ) $(CNC) $(ABI)

data:
	curl $(PAYLOAD_URL)bytes  > $(DATA_DIR)/payload.bytes & \
	curl $(PAYLOAD_URL)json  > $(DATA_DIR)/payload.json & \
	curl $(PAYLOAD_URL)hex  > $(DATA_DIR)/payload.hex
	cat $(DATA_DIR)/payload.hex | fold -w2 | paste -sd' ' -  | sed -E 's/[[:space:]]+/ 0x/g' > $(DATA_DIR)/payload.splitted


#init:
#	python3.9 -m venv /Users/lukaszkalbarczyk/cairo_venv
#	source /Users/lukaszkalbarczyk/cairo_venv/bin/activate
#	brew install gmp
#	pip3 install cairo-lang
#	pip3 install contextvars

#starknet:
#	export STARKNET_WALLET=starkware.starknet.wallets.open_zeppelin.OpenZeppelinAccount
#	export STARKNET_NETWORK=alpha-goerli
