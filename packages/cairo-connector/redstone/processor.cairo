from starkware.cairo.common.cairo_builtins import BitwiseBuiltin, HashBuiltin
from starkware.cairo.common.math import assert_nn, assert_in_range

from redstone.crypto.secp import recover_address
from redstone.crypto.signature import Signature

from redstone.protocol.payload import Payload, get_payload
from redstone.protocol.data_package import DataPackageArray

from redstone.utils.array import Array, array_index

const MAX_DATA_TIMESTAMP_DELAY_SECONDS = 3 * 60;
const MAX_DATA_TIMESTAMP_AHEAD_SECONDS = 1 * 60;

struct Config {
    block_ts: felt,
    allowed_signer_addresses: Array,
}

func process_payload{range_check_ptr, bitwise_ptr: BitwiseBuiltin*}(
    data_ptr: felt*, data_length: felt, config: Config
) -> Payload {
    alloc_locals;

    assert_nn(data_length);

    local payload_arr: Array = Array(ptr=data_ptr, len=data_length);
    let payload = get_payload(bytes_arr=payload_arr);

    validate_data_packages(arr=payload.data_packages, index=0, config=config);

    return payload;
}

func validate_data_packages{range_check_ptr, bitwise_ptr: BitwiseBuiltin*}(
    arr: DataPackageArray, index: felt, config: Config
) {
    if (index == arr.len) {
        return ();
    }

    let package = arr.ptr[index];

    validate_timestamp(package_ts_ms=package.timestamp, block_ts=config.block_ts);
    validate_signature(
        signable_arr=package.signable_arr,
        signature=package.signature,
        allowed_signer_addresses=config.allowed_signer_addresses,
        index=index,
    );

    return validate_data_packages(arr=arr, index=index + 1, config=config);
}

func validate_signature{range_check_ptr, bitwise_ptr: BitwiseBuiltin*}(
    signable_arr: Array, signature: Signature, allowed_signer_addresses: Array, index: felt
) {
    alloc_locals;

    let address = recover_address(signable_arr=signable_arr, signature=signature);
    let signer_index = array_index(arr=allowed_signer_addresses, key=address);

    local addr = address;

    with_attr error_message(
            "signer_index for package #{index} must be nonnegative (address={addr})") {
        assert_nn(signer_index);
    }

    return ();
}

func validate_timestamp{range_check_ptr}(package_ts_ms: felt, block_ts: felt) {
    alloc_locals;

    let min_ts = (block_ts - MAX_DATA_TIMESTAMP_DELAY_SECONDS) * 1000;
    let max_ts = (block_ts + MAX_DATA_TIMESTAMP_AHEAD_SECONDS) * 1000 + 1;

    with_attr error_message(
            "The package timestamp (package_ts_ms={package_ts_ms}) must be in range {min_ts} =< package_ts_ms < {max_ts}") {
        assert_in_range(package_ts_ms, min_ts, max_ts);
    }

    return ();
}
