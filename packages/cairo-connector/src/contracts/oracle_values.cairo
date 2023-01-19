%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin, BitwiseBuiltin
from starkware.cairo.common.math import assert_nn, assert_le, assert_in_range

from redstone.utils.array import Array, array_new

from contracts.core import (
    unique_signer_count_treshold,
    signer_address,
    signer_address_len,
    get_aggregated_values,
    write_addresses,
)

@constructor
func constructor{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    signer_count_treshold: felt, addresses_len: felt, addresses: felt*
) {
    assert_nn(signer_count_treshold);
    assert_in_range(signer_count_treshold, 0, addresses_len);

    unique_signer_count_treshold.write(signer_count_treshold);
    signer_address_len.write(addresses_len);
    write_addresses(ptr=addresses, len=addresses_len, index=0);

    return ();
}

@view
func get_oracle_values{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, bitwise_ptr: BitwiseBuiltin*, range_check_ptr
}(feed_ids_len: felt, feed_ids: felt*, payload_data_len: felt, payload_data: felt*) -> (
    values_len: felt, values: felt*
) {
    alloc_locals;

    let requested_feed_ids = Array(ptr=feed_ids, len=feed_ids_len);

    let values = get_aggregated_values(
        requested_feed_ids=requested_feed_ids,
        payload_data_len=payload_data_len,
        payload_data=payload_data,
    );

    return (values_len=values.len, values=values.ptr);
}

@view
func get_oracle_value{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, bitwise_ptr: BitwiseBuiltin*, range_check_ptr
}(feed_id: felt, payload_data_len: felt, payload_data: felt*) -> (value: felt) {
    alloc_locals;

    let requested_feed_ids = array_new(len=1);
    assert requested_feed_ids.ptr[0] = feed_id;

    let values = get_aggregated_values(
        requested_feed_ids=requested_feed_ids,
        payload_data_len=payload_data_len,
        payload_data=payload_data,
    );

    let value = values.ptr[0];

    return (value=value);
}
