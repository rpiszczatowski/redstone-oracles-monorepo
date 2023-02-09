library protocol;

dep bytes;
dep crypto;

use bytes::*;
use crypto::recover_signer_address;
use std::vec::Vec;
use std::logging::log;
use std::bytes::*;
use std::u256::U256;

const REDSTONE_MARKER = [0x00, 0x00, 0x02, 0xed, 0x57, 0x01, 0x1e, 0x00, 0x00];
const REDSTONE_MARKER_BS = 9;
const UNSIGNED_METADATA_BYTE_SIZE_BS = 3;
const DATA_PACKAGES_COUNT_BS = 2;
const SIGNATURE_BS = 65;
const DATA_POINTS_COUNT_BS = 3;
const DATA_POINT_VALUE_BYTE_SIZE_BS = 4;
const TIMESTAMP_BS = 6;
const DATA_FEED_ID_BS = 32;

pub struct Payload {
    data_packages: Vec<DataPackage>,
}

pub struct DataPackage {
    timestamp: u64,
    signer_address: Address,
    data_points: Vec<DataPoint>,
}

struct DataPoint {
    feed_id: U256,
    value: U256,
}

// 13107200 + byte_index
pub const WRONG_REDSTONE_MARKER = 0xc80000;

pub fn make_payload(bytes: Bytes) -> Payload {
    let (marker_rest, marker_bytes) = bytes_slice_tail(bytes, REDSTONE_MARKER_BS);

    let mut i = 0;
    while (i < REDSTONE_MARKER_BS) {
        if (marker_bytes.get(i).unwrap() != REDSTONE_MARKER[i]) {
            revert(WRONG_REDSTONE_MARKER + i);
        }

        i += 1;
    }

    let (unsigned_metadata_rest, unsigned_metadata_size) = bytes_slice_number(marker_rest, UNSIGNED_METADATA_BYTE_SIZE_BS);
    let (data_package_count_rest, data_package_count) = bytes_slice_number_offset(unsigned_metadata_rest, DATA_PACKAGES_COUNT_BS, unsigned_metadata_size);

    let mut i = 0;
    let mut data_packages = Vec::with_capacity(data_package_count);
    let mut bytes_rest = data_package_count_rest;

    while (i < data_package_count) {
        let (data_package, bytes_taken) = make_data_package(bytes_rest);
        data_packages.push(data_package);

        let (head, _) = bytes_slice_tail(bytes_rest, bytes_taken);
        bytes_rest = head;

        i += 1;
    }

    let payload = Payload { data_packages };

    return payload;
}

fn make_data_package(bytes: Bytes) -> (DataPackage, u64) {
    let (signature_rest, signature_bytes) = bytes_slice_tail(bytes, SIGNATURE_BS);
    let (data_point_count_rest, data_point_count) = bytes_slice_number(signature_rest, DATA_POINTS_COUNT_BS);
    let (data_point_value_size_rest, data_point_value_size) = bytes_slice_number(data_point_count_rest, DATA_POINT_VALUE_BYTE_SIZE_BS);
    let (timestamp_rest, timestamp) = bytes_slice_number(data_point_value_size_rest, TIMESTAMP_BS);
    let (_, data_points_bytes) = bytes_slice_tail(timestamp_rest, data_point_count * (data_point_value_size + DATA_FEED_ID_BS));

    let mut data_points = Vec::with_capacity(data_point_count);
    let mut i = 0;
    let mut rest = data_points_bytes;
    while (i < data_point_count) {
        let (head, dp_bytes) = bytes_slice_tail(rest, DATA_FEED_ID_BS + data_point_value_size);
        rest = head;
        data_points.push(make_data_point(dp_bytes));

        i += 1;
    }
    let signable_bytes_len = DATA_POINTS_COUNT_BS + DATA_POINT_VALUE_BYTE_SIZE_BS + TIMESTAMP_BS + data_point_count * (data_point_value_size + DATA_FEED_ID_BS);
    let (_, signable_bytes) = bytes_slice_tail(signature_rest, signable_bytes_len);

    let signer_address = recover_signer_address(signature_bytes, signable_bytes);

    let data_package = DataPackage {
        signer_address,
        timestamp,
        data_points,
    };

    return (data_package, signable_bytes_len + SIGNATURE_BS);
}

fn make_data_point(bytes: Bytes) -> DataPoint {
    let (feed_id_bytes, value_bytes) = bytes_slice_tail(bytes, bytes.len - DATA_FEED_ID_BS);

    let data_point = DataPoint {
        feed_id: bytes_to_b256(feed_id_bytes),
        value: bytes_to_u256(value_bytes),
    };

    return data_point;
}
