contract;

dep prices_abi;

use std::vec::Vec;
use std::bytes::Bytes;
use std::u256::U256;
use std::block::timestamp;

use prices_abi::Prices;
use redstone::processor::process_input;
use redstone::config::Config;

const REQUIRED_SIGNER_COUNT = 1;

storage {
    prices: StorageMap<U256, U256> = StorageMap {},
    timestamp: u64 = 0,
}

const empty_result: [U256; 50] = [
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
];

impl Prices for Contract {
    fn get_prices(feed_ids: Vec<U256>, payload: Vec<u64>) -> [U256; 50] {
        let (prices, _) = get_prices(feed_ids, payload);

        return prices;
    }

    #[storage(read)]
    fn read_timestamp() -> u64 {
        return storage.timestamp;
    }

    #[storage(read)]
    fn read_prices(feed_ids: Vec<U256>) -> [U256; 50] {
        let mut result = empty_result;

        let mut i = 0;
        while (i < feed_ids.len) {
            let feed_id = feed_ids.get(i).unwrap();
            let price = storage.prices.get(feed_id);
            match price {
                Option::Some(value) => {
                    result[i] = value;
                },
                Option::None => {}
            }

            i += 1;
        }

        return result;
    }

    #[storage(write)]
    fn write_prices(feed_ids: Vec<U256>, payload: Vec<u64>) -> [U256; 50] {
        let (aggregated_values, block_timestamp) = get_prices(feed_ids, payload);
        let mut i = 0;
        while (i < feed_ids.len) {
            let feed_id = feed_ids.get(i).unwrap();
            let price = aggregated_values[i];
            storage.prices.insert(feed_id, price);

            i += 1;
        }

        storage.timestamp = block_timestamp;

        return aggregated_values;
    }
}

fn get_prices(feed_ids: Vec<U256>, payload: Vec<u64>) -> ([U256; 50], u64) {
    let mut signers: Vec<b256> = Vec::with_capacity(6);
    signers.push(0x00000000000000000000000012470f7aba85c8b81d63137dd5925d6ee114952b);
    signers.push(0x000000000000000000000000109B4a318A4F5ddcbCA6349B45f881B4137deaFB);
    signers.push(0x0000000000000000000000001ea62d73edf8ac05dfcea1a34b9796e937a29eff);
    signers.push(0x0000000000000000000000002c59617248994D12816EE1Fa77CE0a64eEB456BF);
    signers.push(0x00000000000000000000000083cba8c619fb629b81a65c2e67fe15cf3e3c9747);
    signers.push(0x000000000000000000000000f786a909d559f5dee2dc6706d8e5a81728a39ae9);  //rapid
    let block_timestamp = timestamp() - (10 + (1 << 62));

    let config = Config {
        feed_ids,
        signers,
        required_signer_count: REQUIRED_SIGNER_COUNT,
        block_timestamp,
    };

    let mut payload_bytes = Bytes::new();

    // payload.buf.ptr.copy_bytes_to(payload_bytes.buf.ptr, payload.len);
    let mut i = 0;
    while (i < payload.len) {
        payload_bytes.push(payload.get(i).unwrap());

        i += 1;
    }

    let aggregated_values = process_input(payload_bytes, config);

    let mut prices = empty_result;

    let mut i = 0;
    while (i < aggregated_values.len) {
        prices[i] = aggregated_values.get(i).unwrap();

        i += 1;
    }
    return (prices, block_timestamp);
}
