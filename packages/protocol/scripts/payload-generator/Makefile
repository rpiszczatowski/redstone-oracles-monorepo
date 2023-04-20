PAYLOAD_URL=https://d33trozg86ya9x.cloudfront.net/data-packages/payload?unique-signers-count=1&data-service-id=redstone-rapid-demo&data-feeds=BTC,ETH,BNB,AR,AVAX,CELO&format=

DATA_DIR=./data
SHELL := /bin/bash

clean:
	rm -rf $(DATA_DIR)

fetch_time:
		curl -L -H "Accept: application/json" unixtimesta.mp > $(DATA_DIR)/${DATA_NAME}.time

prepare_data: BLOCK_TIMESTAMP=$(shell cat $(DATA_DIR)/${DATA_NAME}.time  | grep -o '"timestamp":\d*' | cut -d':' -f2)
	
# make DATA_NAME=test prepare_data
prepare_data: fetch_time
	mkdir -p $(DATA_DIR)
	
	curl "$(PAYLOAD_URL)hex" > $(DATA_DIR)/${DATA_NAME}.hex &
	curl "$(PAYLOAD_URL)json" | cut -c 2- | sed 's/\\"/"/g' | sed 's/.$$//g' > $(DATA_DIR)/${DATA_NAME}.json &
	curl "$(PAYLOAD_URL)bytes" > $(DATA_DIR)/${DATA_NAME}.tmp
	
	printf '{"bytes":' > $(DATA_DIR)/${DATA_NAME}.input 
	cat $(DATA_DIR)/${DATA_NAME}.tmp >> $(DATA_DIR)/${DATA_NAME}.input 
	rm $(DATA_DIR)/${DATA_NAME}.tmp
	echo ',' >> $(DATA_DIR)/${DATA_NAME}.input 
	cat $(DATA_DIR)/${DATA_NAME}.time | cut -c 2- >> $(DATA_DIR)/${DATA_NAME}.input 
	cat $(DATA_DIR)/${DATA_NAME}.hex | fold -w2 | paste -sd' ' -  | sed -E 's/[[:space:]]+/ 0x/g' | cut -c 3- > $(DATA_DIR)/${DATA_NAME}.splitted

	echo "" >  $(DATA_DIR)/${DATA_NAME}.cairo;
	echo -e "use array::ArrayTrait;\n" >> $(DATA_DIR)/${DATA_NAME}.cairo
	echo -e 'const SAMPLE_BLOCK_TIMESTAMP:u64 = ${BLOCK_TIMESTAMP}_u64;\n' >> $(DATA_DIR)/${DATA_NAME}.cairo
	echo -e "fn sample_payload_bytes() -> Array<u8> {\n\tlet mut arr: Array<u8> = ArrayTrait::new();" >> $(DATA_DIR)/${DATA_NAME}.cairo
	cat $(DATA_DIR)/${DATA_NAME}.hex | fold -w2 | paste -sd' ' -  | sed -E 's/[[:space:]]+/_u8);\n\tarr.append(0x/g' | sed 1d >> $(DATA_DIR)/${DATA_NAME}.cairo
	echo -e "_u8); \n\tarr\n }\n" >> $(DATA_DIR)/${DATA_NAME}.cairo
