from starkware.cairo.common.cairo_builtins import BitwiseBuiltin, HashBuiltin
from starkware.cairo.common.math import assert_nn, assert_in_range, assert_le

from redstone.crypto.secp import recover_address
from redstone.crypto.signature import Signature

from redstone.utils.array import Array, array_index

const MAX_DATA_TIMESTAMP_DELAY_SECONDS = 5 * 60;
const MAX_DATA_TIMESTAMP_AHEAD_SECONDS = 1 * 60;

func validate_signature{range_check_ptr, bitwise_ptr: BitwiseBuiltin*}(
    signable_arr: Array, signature: Signature, allowed_signer_addresses: Array, index: felt
) -> felt {
    alloc_locals;

    let address = recover_address(signable_arr=signable_arr, signature=signature);
    let signer_index = array_index(arr=allowed_signer_addresses, key=address);

    local addr = address;

    with_attr error_message("Unrecognized signer for package #{index} (address={addr}") {
        assert_nn(signer_index);
    }

    return signer_index;
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

func validate_signer_count_treshold{range_check_ptr}(count: felt, treshold: felt, index: felt) {
    with_attr error_message(
            "Unique signer count treshold (required: {treshold}) for data feed #{index} not achieved (currently: {count})") {
        assert_le(treshold, count);
    }

    return ();
}
