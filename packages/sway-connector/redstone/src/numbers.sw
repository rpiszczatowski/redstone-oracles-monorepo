library numbers;

dep from_bytes;

use std::{bytes::Bytes, u256::U256};
use from_bytes::FromBytes;

impl U256 {
    pub fn from_u64(number: u64) -> U256 {
        U256 {
            a: 0,
            b: 0,
            c: 0,
            d: number,
        }
    }
}

impl FromBytes for u64 {
    fn from_bytes(bytes: Bytes) -> u64 {
        assert(bytes.len <= 8);
        let mut i = 0;
        let mut number: u64 = 0;
        while (i < bytes.len) {
            let exp = u64::pow(256, bytes.len - i - 1);
            let base: u64 = bytes.get(i).unwrap();
            number += (base * exp);

            i += 1;
        }

        return number;
    }
}
