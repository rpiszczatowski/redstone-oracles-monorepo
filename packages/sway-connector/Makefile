
DATA_NAME=test
IS_LOCAL=1

CONTRACT_ID=0x865b2fbbc3b6f16e8a747d1a7629418d69fea5eeaaf87673a3d01a39a504e5e1

ifeq ($(IS_LOCAL), 0)
#	SIGNING_KEY= # forc-wallet export --account-index=0
	NODE_URL=node-beta-2.fuel.network/graphql 
	GAS_PRICE=1
else
	SIGNING_KEY=--unsigned
	NODE_URL=127.0.0.1:4000
	GAS_PRICE=0
endif

SCRIPT=script
CONTRACT=contract
INVOKER=invoker
LIBRARY=redstone
DATA_DIR=../data-generator/data

format:
	cd $(SCRIPT) && forc-fmt
	cd $(CONTRACT) && forc-fmt
	cd $(INVOKER) && forc-fmt
	cd $(LIBRARY) && forc-fmt

run: format
	cd $(SCRIPT) && forc run --unsigned -r \
	--data $(shell cat $(DATA_DIR)/$(DATA_NAME).hex)

# make SIGNING_KEY=5b4 invoke
invoke: format
	cd $(INVOKER) && forc run -r \
	--data $(shell cat $(DATA_DIR)/$(DATA_NAME).hex) \
	--node-url $(NODE_URL) \
	--contract $(CONTRACT_ID) \
	--gas-limit 900000000 \
	--gas-price $(GAS_PRICE) $(SIGNING_KEY) 

# make SIGNING_KEY=5b4 invoke
deploy: format
	cd $(CONTRACT) && forc deploy \
	--node-url $(NODE_URL) \
	--gas-price $(GAS_PRICE) $(SIGNING_KEY)

test: format
	cd $(LIBRARY) && forc test

prepare_data:
	make -C ../data-generator DATA_NAME=$(DATA_NAME) prepare_data
