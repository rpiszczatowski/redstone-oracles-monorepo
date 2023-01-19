%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin, BitwiseBuiltin
from starkware.cairo.common.math import assert_nn, assert_le, assert_in_range, sign

from redstone.utils.array import Array, array_new

from contracts.ownable import (
    write_owner,
    assert_owner,
    get_owner_and_caller as ownable_get_owner_and_caller,
)

from contracts.core import (
    unique_signer_count_treshold,
    signer_address,
    signer_address_len,
    get_aggregated_values,
    write_addresses,
)

@storage_var
func price(feed_id: felt) -> (res: felt) {
}

@constructor
func constructor{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    owner_address: felt, signer_count_treshold: felt, addresses_len: felt, addresses: felt*
) {
    assert_nn(signer_count_treshold);
    assert_in_range(signer_count_treshold, 0, addresses_len);

    write_owner(owner_address=owner_address);

    unique_signer_count_treshold.write(signer_count_treshold);
    signer_address_len.write(addresses_len);
    write_addresses(ptr=addresses, len=addresses_len, index=0);

    return ();
}

@view
func get_owner_and_caller{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, bitwise_ptr: BitwiseBuiltin*, range_check_ptr
}() -> (owner: felt, caller: felt) {
    let (owner, caller) = ownable_get_owner_and_caller();

    return (owner=owner, caller=caller);
}

@view
func get_price{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, bitwise_ptr: BitwiseBuiltin*, range_check_ptr
}(feed_id: felt) -> (value: felt) {
    alloc_locals;

    let (value) = price.read(feed_id=feed_id);

    return (value=value);
}

@view
func set_price{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, bitwise_ptr: BitwiseBuiltin*, range_check_ptr
}(feed_id: felt, payload_data_len: felt, payload_data: felt*) {
    alloc_locals;

    assert_owner();

    let requested_feed_ids = array_new(len=1);
    assert requested_feed_ids.ptr[0] = feed_id;

    return set_prices(
        feed_ids_len=requested_feed_ids.len,
        feed_ids=requested_feed_ids.ptr,
        payload_data_len=payload_data_len,
        payload_data=payload_data,
    );
}

@external
func set_prices{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, bitwise_ptr: BitwiseBuiltin*, range_check_ptr
}(feed_ids_len: felt, feed_ids: felt*, payload_data_len: felt, payload_data: felt*) {
    alloc_locals;

    let requested_feed_ids = Array(ptr=feed_ids, len=feed_ids_len);

    let values = get_aggregated_values(
        requested_feed_ids=requested_feed_ids,
        payload_data_len=payload_data_len,
        payload_data=payload_data,
    );

    return write_prices(feed_ids=requested_feed_ids, values=values, index=0);
}

func write_prices{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, bitwise_ptr: BitwiseBuiltin*, range_check_ptr
}(feed_ids: Array, values: Array, index: felt) {
    if (index == feed_ids.len) {
        return ();
    }

    let feed_id = feed_ids.ptr[index];
    let value = values.ptr[index];

    price.write(feed_id, value);

    return write_prices(feed_ids=feed_ids, values=values, index=index + 1);
}
