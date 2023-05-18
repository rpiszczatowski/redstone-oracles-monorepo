
DATA_NAME=fuel
IS_LOCAL=1

SALT=0x0000000000000000000000000000000000000000000000000000000000000001

ifeq ($(IS_LOCAL), 0)
#	SIGNING_KEY= # forc-wallet account 0
	NODE_URL=beta-3.fuel.network/graphql 
	GAS_PRICE=1
else
	SIGNING_KEY=--unsigned
	NODE_URL=127.0.0.1:4000
	GAS_PRICE=0
endif

DEMO=demo
CONTRACT=contract
INVOKER=contract_invoker
INITIALIZER=contract_initializer
LIBRARY=redstone
DATA_GENERATOR=../../../packages/protocol/scripts/payload-generator
DATA_DIR=$(DATA_GENERATOR)/data
CONTRACT_ID_FILE=CONTRACT_ID
CONTRACT_ID=$(shell cat $(CONTRACT)/$(CONTRACT_ID_FILE))

format:
	cd $(DEMO) && forc-fmt
	cd $(CONTRACT) && forc-fmt
	cd $(INVOKER) && forc-fmt
	cd $(INITIALIZER) && forc-fmt
	cd $(LIBRARY) && forc-fmt

run: format
	cd $(DEMO) && forc run -r --unsigned \
	--data $(shell cat $(DATA_DIR)/$(DATA_NAME).hex)

# make SIGNING_KEY=5b4 invoke
invoke: format
	cd $(INVOKER) && forc run -r \
	--data $(shell cat $(DATA_DIR)/$(DATA_NAME).hex) \
	--node-url $(NODE_URL) \
	--contract $(CONTRACT_ID) \
	--gas-limit 100000000 \
	--gas-price $(GAS_PRICE) $(SIGNING_KEY) 

contract: format
	cd $(CONTRACT) && forc build

# make SIGNING_KEY=5b4 invoke
deploy: format
	echo "For the beta-2 node the 'forc' version must not be greater than 0.34.0"
	cd $(CONTRACT) && forc deploy --terse \
	--salt $(SALT) \
	--node-url $(NODE_URL) \
	--gas-price $(GAS_PRICE) $(SIGNING_KEY)
	cd $(CONTRACT) && forc contract-id --terse  | grep "Contract id:" | cut -c 20- > $(CONTRACT_ID_FILE)
	cat $(INITIALIZER)/src/main.sw | sed -E "s|CONTRACT_ID: b256 = 0x([0-9a-f])+,|CONTRACT_ID: b256 = $(shell cat $(CONTRACT)/$(CONTRACT_ID_FILE)),|g" > tmp.sw;
	mv tmp.sw $(INITIALIZER)/src/main.sw
	cat $(INVOKER)/src/main.sw | sed -E "s|CONTRACT_ID: b256 = 0x([0-9a-f])+,|CONTRACT_ID: b256 = $(shell cat $(CONTRACT)/$(CONTRACT_ID_FILE)),|g" > tmp.sw
	mv tmp.sw $(INVOKER)/src/main.sw

init: format
	cd $(INITIALIZER) && forc run -r \
	--data 0x0$(IS_LOCAL) \
	--node-url $(NODE_URL) \
	--contract $(CONTRACT_ID) \
	--gas-limit 100000000 \
	--gas-price $(GAS_PRICE) $(SIGNING_KEY)

test: format
	cd $(LIBRARY) && forc test

prepare_data:
	make -C $(DATA_GENERATOR) DATA_NAME=$(DATA_NAME) prepare_data
