library config_validation;

dep protocol;
dep config;
dep validation;

use std::u256::U256;
use protocol::{DataPackage, Payload};
use config::Config;
use validation::*;

/// 655360000 + feed_index
pub const INSUFFICIENT_SIGNER_COUNT_FOR = 0x2710_0000;

/// 2621440000 + data_package_index
pub const SIGNER_NOT_RECOGNIZED = 0x4e20_0000;

trait Validation {
    fn validate_timestamps(self, payload: Payload);
    fn validate_signer_count(self, values: Vec<Vec<U256>>);
    fn validate_signer(self, data_package: DataPackage, index: u64) -> u64;
}

impl Validation for Config {
    fn validate_timestamps(self, payload: Payload) {
        let mut i = 0;
        while (i < payload.data_packages.len) {
            let timestamp = payload.data_packages.get(i).unwrap().timestamp / 1000;
            let block_timestamp = self.block_timestamp;

            validate_timestamp(i, timestamp, block_timestamp);

            i += 1;
        }
    }

    fn validate_signer_count(self, results: Vec<Vec<U256>>) {
        let mut i = 0;
        while (i < results.len) {
            let values = results.get(i).unwrap();
            if (values.len < self.required_signer_count) {
                log(values.len);
                revert(INSUFFICIENT_SIGNER_COUNT_FOR + i);
            }

            i += 1;
        }
    }

    fn validate_signer(self, data_package: DataPackage, index: u64) -> u64 {
        let s = self.signer_index(data_package.signer_address.value);

        if s.is_none() {
            log(data_package.signer_address.value);
            revert(SIGNER_NOT_RECOGNIZED + index);
        }

        return s.unwrap();
    }
}
