use integer::u32_to_felt252;

use redstone::config::ConfigurableTrait;
use redstone::config::Config;
use redstone::validation::validate_timestamp;

/// 655360000 + feed_index + 10000 * count
const INSUFFICIENT_SIGNER_COUNT: felt252 = 0x27100000;

/// 1310720000 + data_package_index
const SIGNER_NOT_RECOGNIZED: felt252 = 0x4e200000;

trait ValidableTrait<T> {
    fn validate_timestamp(self: T, index: usize, timestamp: felt252);
    fn validate_signer_count(self: T, feed_index: usize, count: usize);
}

impl ValidableConfig of ValidableTrait<Config> {
    fn validate_timestamp(self: Config, index: usize, timestamp: felt252) {
        validate_timestamp(:index, :timestamp, block_timestamp: self.block_timestamp);
    }

    fn validate_signer_count(self: Config, feed_index: usize, count: usize) {
        assert(
            count >= self.signer_count_threshold,
            INSUFFICIENT_SIGNER_COUNT + u32_to_felt252(feed_index + 10000_usize * count)
        );
    }
}
