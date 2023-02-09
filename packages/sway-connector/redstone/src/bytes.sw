library bytes;

use std::bytes::*;
use std::math::*;
use std::b256::*;
use std::u256::U256;

pub fn bytes_slice_tail(bytes: Bytes, tail_size: u64) -> (Bytes, Bytes) {
    return bytes_slice_tail_offset(bytes, tail_size, 0);
}

pub fn bytes_slice_tail_offset(bytes: Bytes, tail_size: u64, tail_offset: u64) -> (Bytes, Bytes) {
    let (head, mut tail) = bytes.split_at(bytes.len - tail_size - tail_offset);
    tail.len = tail_size;

    return (head, tail);
}

pub fn bytes_slice_number(bytes: Bytes, tail_size: u64) -> (Bytes, u64) {
    return bytes_slice_number_offset(bytes, tail_size, 0);
}

pub fn bytes_slice_number_offset(bytes: Bytes, tail_size: u64, tail_offset: u64) -> (Bytes, u64) {
    let (head, tail) = bytes_slice_tail_offset(bytes, tail_size, tail_offset);

    return (head, bytes_to_number(tail));
}

pub fn bytes_to_number(bytes: Bytes) -> u64 {
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

pub fn bytes_to_u256(bytes: Bytes) -> U256 {
    let mut parts = Vec::new();

    let mut n = bytes.len;
    let mut o = 0;
    while (n > 0) {
        let mut m = 8;
        if (n < 8) {
            m = n;
        }
        let (rest, num) = bytes_slice_number_offset(bytes, m, o);
        parts.push(num);

        n -= m;
        o += m;
    }

    return U256 {
        a: parts.get(3).unwrap_or(0),
        b: parts.get(2).unwrap_or(0),
        c: parts.get(1).unwrap_or(0),
        d: parts.get(0).unwrap_or(0),
    }
}

pub fn bytes_to_b256(bytes: Bytes) -> U256 {
    return bytes_to_u256(bytes_trunc(bytes));
}

fn bytes_trunc(bytes: Bytes) -> Bytes {
    let mut n = bytes.len - 1;
    let mut result = bytes;
    while (n > 0) {
        if (bytes.get(n).unwrap() == 0) {
            n -= 1;
            continue;
        }

        break;
    }

    result.len = n + 1;

    return result;
}
