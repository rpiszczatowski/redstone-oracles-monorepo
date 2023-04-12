use integer::u8_to_felt252;
use integer::u32_to_felt252;
use integer::u32_try_from_felt252;
use array::ArrayTrait;
use option::OptionTrait;

use ecdsa::check_ecdsa_signature;
use hash::LegacyHash;
use array::SpanTrait;

use redstone::constants::REDSTONE_MARKER;
use redstone::constants::REDSTONE_MARKER_BS;
use redstone::constants::UNSIGNED_METADATA_BYTE_SIZE_BS;
use redstone::constants::DATA_PACKAGES_COUNT_BS;
use redstone::constants::SIGNATURE_BS;
use redstone::constants::DATA_POINTS_COUNT_BS;
use redstone::constants::DATA_POINT_VALUE_BYTE_SIZE_BS;
use redstone::constants::TIMESTAMP_BS;
use redstone::constants::DATA_FEED_ID_BS;

use redstone::gas::out_of_gas_array;
use redstone::config::Config;
use redstone::config_validation::ValidableTrait;
use redstone::numbers::Felt252Div;
use redstone::sliceable_array::SliceableArrayTrait;
use redstone::number_convertible_array::NumberConvertibleArrayTrait;
use redstone::signature::Signature;
use redstone::signature::get_signature_from_bytes;

#[derive(Copy, Drop)]
struct Payload {
    data_packages: @Array<DataPackage>
}

#[derive(Drop, Copy)]
struct DataPoint {
    value: felt252,
    // TODO: change felt252 to u256
    feed_id: felt252,
}

#[derive(Drop, Copy)]
struct DataPackage {
    signature: Signature,
    timestamp: felt252,
    data_points: @Array<DataPoint>,
    signer_address: felt252,
    index: usize
}

fn get_payload_from_bytes(arr: Array<u8>, validator: Config) -> Payload {
    let marker_slice = arr.slice_number(REDSTONE_MARKER_BS);

    let data_package_count_slice = marker_slice.head.slice_number_offset(
        DATA_PACKAGES_COUNT_BS, UNSIGNED_METADATA_BYTE_SIZE_BS
    );

    let mut data_packages: Array<DataPackage> = ArrayTrait::new();

    slice_data_packages(
        arr: data_package_count_slice.head,
        :validator,
        count: data_package_count_slice.number,
        ref acc: data_packages
    );

    Payload { data_packages: @data_packages }
}

fn slice_data_packages(
    arr: @Array<u8>, validator: Config, count: felt252, ref acc: Array<DataPackage>
) {
    match gas::withdraw_gas_all(get_builtin_costs()) {
        Option::Some(_) => {},
        Option::None(_) => panic(out_of_gas_array()),
    };

    if (count == 0) {
        return ();
    }

    let signature_slice = arr.slice_tail(SIGNATURE_BS);
    let data_point_count_slice = signature_slice.head.slice_number(DATA_POINTS_COUNT_BS);
    let value_size_slice = data_point_count_slice.head.slice_number(DATA_POINT_VALUE_BYTE_SIZE_BS);

    let value_size = u32_try_from_felt252(value_size_slice.number).unwrap();
    let data_point_count = u32_try_from_felt252(data_point_count_slice.number).unwrap();
    let data_points_array_size = data_point_count * (value_size + DATA_FEED_ID_BS);

    let timestamp_slice = value_size_slice.head.slice_number(TIMESTAMP_BS);
    let timestamp = timestamp_slice.number;

    validator.validate_timestamp(index: acc.len(), timestamp: timestamp / 1000);
    let data_points_slice = timestamp_slice.head.slice_tail(data_points_array_size);

    let signature = get_signature_from_bytes(signature_slice.tail);
    let mut signable_bytes_span = signature_slice.head.slice_tail(
        data_points_array_size + DATA_POINTS_COUNT_BS + DATA_POINT_VALUE_BYTE_SIZE_BS + TIMESTAMP_BS
    ).tail.span();

    let hash = hash_span(0, signable_bytes_span);
    let value = check_ecdsa_signature(
        hash,
        0x18f349a975878208678624cc989a5613c76980dc0fd995f5f31498dca168f9d,
        signature.r_bytes.to_felt252(),
        signature.s_bytes.to_felt252()
    );

    let mut data_points: Array<DataPoint> = ArrayTrait::new();
    slice_data_points(timestamp_slice.head, value_size, data_point_count, ref data_points);

    let data_package = DataPackage {
        timestamp, index: acc.len(), signature, data_points: @data_points, signer_address: 0
    };

    acc.append(data_package);

    slice_data_packages(arr: data_points_slice.head, :validator, count: count - 1, ref :acc);
}

fn slice_data_points(arr: @Array<u8>, value_size: usize, count: usize, ref acc: Array<DataPoint>) {
    match gas::withdraw_gas_all(get_builtin_costs()) {
        Option::Some(_) => {},
        Option::None(_) => panic(out_of_gas_array()),
    };

    if (count == 0_usize) {
        return ();
    }

    let value_slice = arr.slice_number(value_size);
    let feed_id_slice = value_slice.head.slice_tail(value_size);

    let data_point = DataPoint {
        value: value_slice.number, feed_id: feed_id_slice.tail.to_string_number()
    };

    acc.append(data_point);

    slice_data_points(feed_id_slice.head, value_size, count - 1_usize, ref acc)
}


fn hash_span(state: felt252, mut value: Span<u8>) -> felt252 {
    match gas::withdraw_gas_all(get_builtin_costs()) {
        Option::Some(_) => {},
        Option::None(_) => panic(out_of_gas_array()),
    };

    let item = value.pop_front();
    match item {
        Option::Some(x) => {
            let s = LegacyHash::hash(u8_to_felt252(*x), state);
            hash_span(s, value)
        },
        Option::None(_) => state,
    }
}



