
DATA_NAME=test
IS_LOCAL=1

CONTRACT_ID=0xbc01b40b335d443392dad1765f446e917163b151c0a4f5eb831ccddda0f25e5c

ifeq ($(IS_LOCAL), 0)
#	SIGNING_KEY= # forc-wallet export --account-index=0
	NODE_URL=node-beta-2.fuel.network/graphql 
	GAS_PRICE=1
else
	SIGNING_KEY=--unsigned
	NODE_URL=127.0.0.1:4000
	GAS_PRICE=0
endif

DEMO=sway/demo
CONTRACT=sway/contract
INVOKER=sway/contract_invoker
INITIALIZER=sway/contract_initializer
LIBRARY=sway/redstone
DATA_GENERATOR=../data-generator
DATA_DIR=$(DATA_GENERATOR)/data

format:
	cd $(DEMO) && forc-fmt
	cd $(CONTRACT) && forc-fmt
	cd $(INVOKER) && forc-fmt
	cd $(INITIALIZER) && forc-fmt
	cd $(LIBRARY) && forc-fmt

run: format
	cd $(DEMO) && forc run --unsigned -r \
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
	cd $(CONTRACT) && forc build --terse

# make SIGNING_KEY=5b4 invoke
deploy: format
	cd $(CONTRACT) && forc deploy --terse \
	--node-url $(NODE_URL) \
	--gas-price $(GAS_PRICE) $(SIGNING_KEY)

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
