from starkware.cairo.common.cairo_builtins import BitwiseBuiltin, HashBuiltin, SignatureBuiltin
from starkware.cairo.common.math import assert_nn, assert_in_range, assert_le

from redstone.crypto.secp import recover_address
from redstone.crypto.signature import Signature

from redstone.utils.array import Array, array_index
from starkware.cairo.common.signature import verify_ecdsa_signature

const MAX_DATA_TIMESTAMP_DELAY_SECONDS = 5 * 60;
const MAX_DATA_TIMESTAMP_AHEAD_SECONDS = 1 * 60;

func validate_signature{
    range_check_ptr, bitwise_ptr: BitwiseBuiltin*, keccak_ptr: felt*, ecdsa_ptr: SignatureBuiltin*
}(signable_arr: Array, signature: Signature, allowed_signer_addresses: Array, index: felt) -> felt {
    alloc_locals;

    // let address = recover_address(signable_arr=signable_arr, signature=signature);
    // let signer_index = array_index(arr=allowed_signer_addresses, key=address);

    verify_ecdsa_signature(
        message=0x4b542aacfbdd90551875c3d3df6eec04625941ac17ce1a181791783c70ad1d9,
        public_key=0x399ab58e2d17603eeccae95933c81d504ce475eb1bd0080d2316b84232e133c,
        signature_r=signature.r,
        signature_s=signature.s,
    );

    let signer_index = 1;

    return signer_index;
}

func validate_timestamp{range_check_ptr}(package_ts_ms: felt, block_ts: felt) {
    alloc_locals;

    let min_ts = (block_ts - MAX_DATA_TIMESTAMP_DELAY_SECONDS) * 1000;
    let max_ts = (block_ts + MAX_DATA_TIMESTAMP_AHEAD_SECONDS) * 1000 + 1;

    with_attr error_message(
            "The package timestamp (package_ts_ms={package_ts_ms}) must be in range {min_ts} =< package_ts_ms < {max_ts}") {
        // assert_in_range(package_ts_ms, min_ts, max_ts);
    }

    return ();
}

func validate_signer_count_treshold{range_check_ptr}(count: felt, treshold: felt, index: felt) {
    with_attr error_message(
            "Insufficient unique signer count for data feed #{index} (currently: {count} for required treshold: {treshold})") {
        // assert_le(treshold, count);
    }

    return ();
}
