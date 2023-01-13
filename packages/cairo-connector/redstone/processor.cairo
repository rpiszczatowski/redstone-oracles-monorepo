from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.cairo_builtins import BitwiseBuiltin, HashBuiltin
from starkware.cairo.common.math import assert_nn
from starkware.cairo.common.dict import dict_write, dict_read
from starkware.cairo.common.dict_access import DictAccess
from starkware.cairo.common.serialize import serialize_word

from redstone.validation import validate_timestamp, validate_signature
from redstone.config import Config
from redstone.results import Results, make_results

from redstone.protocol.payload import Payload, get_payload
from redstone.protocol.data_package import DataPackageArray
from redstone.protocol.data_point import DataPointArray

from redstone.utils.array import ARRAY_UNKNOWN_INDEX, Array, array_index, array_new
from redstone.utils.dict import DICT_UNKNOWN_VALUE, Dict, dict_new

func process_payload{range_check_ptr, bitwise_ptr: BitwiseBuiltin*}(
    data_ptr: felt*, data_length: felt, config: Config
) -> (payload: Payload, results: Results) {
    alloc_locals;

    assert_nn(data_length);

    local payload_arr: Array = Array(ptr=data_ptr, len=data_length);
    let payload = get_payload(bytes_arr=payload_arr);

    let matrix = dict_new();
    local dict_ptr: DictAccess* = matrix.ptr;
    process_data_packages{dict_ptr=dict_ptr}(arr=payload.data_packages, config=config, index=0);

    let results = make_results{dict_ptr=dict_ptr}(config=config);

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

    if (price_index == ARRAY_UNKNOWN_INDEX) {
        tempvar dict_ptr = dict_ptr;
    } else {
        let key = config.requested_feed_ids.len * price_index + signer_index;

        dict_write(key, dp.value);
    }

    return process_data_package(
        data_points=data_points, signer_index=signer_index, config=config, index=index + 1
    );
}
