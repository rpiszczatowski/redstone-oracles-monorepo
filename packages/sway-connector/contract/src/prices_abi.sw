library prices_abi;

use std::vec::Vec;
use std::bytes::Bytes;
use std::u256::U256;

abi Prices {
    fn get_prices(feed_ids: Vec<U256>, payload: Vec<u64>) -> [U256; 50];

    #[storage(read)]
    fn read_timestamp() -> u64;

    #[storage(read)]
    fn read_prices(feed_ids: Vec<U256>) -> [U256; 50];

    #[storage(write)]
    fn write_prices(feed_ids: Vec<U256>, payload: Vec<u64>) -> [U256; 50];
}
