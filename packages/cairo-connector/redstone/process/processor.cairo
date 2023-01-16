from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.cairo_builtins import BitwiseBuiltin, HashBuiltin
from starkware.cairo.common.math import assert_nn
from starkware.cairo.common.dict_access import DictAccess
from starkware.cairo.common.serialize import serialize_word

from redstone.protocol.payload import Payload, get_payload
from redstone.protocol.data_package import DataPackageArray
from redstone.protocol.data_point import DataPointArray

from redstone.utils.array import ARRAY_UNKNOWN_INDEX, Array, array_index, array_new
from redstone.utils.dict import Dict, dict_new

from redstone.process.config import Config
from redstone.process.results import Results, make_results, write_results_value
from redstone.process.validation import (
    validate_timestamp,
    validate_signature,
    validate_signer_count_treshold,
)

func process_payload{range_check_ptr, bitwise_ptr: BitwiseBuiltin*}(
    data_ptr: felt*, data_length: felt, config: Config
) -> (payload: Payload, results: Results) {
    alloc_locals;

    assert_nn(data_length);

    local payload_arr: Array = Array(ptr=data_ptr, len=data_length);
    let payload = get_payload(bytes_arr=payload_arr);

    let results_dic = dict_new();
    local dict_ptr: DictAccess* = results_dic.ptr;
    process_data_packages{dict_ptr=dict_ptr}(arr=payload.data_packages, config=config, index=0);

    let results = make_results{dict_ptr=dict_ptr}(config=config);
    validate_signer_count_treshold(results=results, treshold=config.signer_count_treshold, index=0);

    return (payload=payload, results=results);
}

func process_data_packages{range_check_ptr, bitwise_ptr: BitwiseBuiltin*, dict_ptr: DictAccess*}(
    arr: DataPackageArray, config: Config, index: felt
) {
    alloc_locals;

    if (index == arr.len) {
        return ();
    }

    let package = arr.ptr[index];

    validate_timestamp(package_ts_ms=package.timestamp, block_ts=config.block_ts);
    let signer_index = validate_signature(
        signable_arr=package.signable_arr,
        signature=package.signature,
        allowed_signer_addresses=config.allowed_signer_addresses,
        index=index,
    );

    process_data_package(
        data_points=package.data_points, signer_index=signer_index, config=config, index=0
    );

    return process_data_packages(arr=arr, config=config, index=index + 1);
}

func process_data_package{range_check_ptr, dict_ptr: DictAccess*}(
    data_points: DataPointArray, signer_index: felt, config: Config, index: felt
) {
    alloc_locals;

    if (index == data_points.len) {
        return ();
    }

    let dp = data_points.ptr[index];
    let price_index = array_index(arr=config.requested_feed_ids, key=dp.feed_id);

    write_results_value(
        config=config, value=dp.value, price_index=price_index, signer_index=signer_index
    );

    return process_data_package(
        data_points=data_points, signer_index=signer_index, config=config, index=index + 1
    );
}
