%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin, BitwiseBuiltin
from starkware.cairo.common.math import assert_nn, assert_le

from starkware.starknet.common.syscalls import get_block_timestamp

from redstone.protocol.payload import Payload, get_price

from redstone.utils.array import Array, array_new

from redstone.process.config import Config
from redstone.process.processor import process_payload as redstone_process_payload

@storage_var
func btc_price() -> (res: felt) {
}

@storage_var
func signer_address(index: felt) -> (res: felt) {
}

@storage_var
func signer_address_len() -> (res: felt) {
}

@constructor
func constructor{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    addresses_len: felt, addresses: felt*
) {
    assert_nn(addresses_len);

    signer_address_len.write(addresses_len);
    write_addresses(ptr=addresses, len=addresses_len, index=0);

    return ();
}

@external
func process_payload{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, bitwise_ptr: BitwiseBuiltin*, range_check_ptr
}(data_ptr_len: felt, data_ptr: felt*) {
    alloc_locals;

    let allowed_signer_addresses = get_allowed_signer_addresses();
    let (block_ts) = get_block_timestamp();
    let requested_feed_ids = array_new(len=1);
    assert requested_feed_ids.ptr[0] = 'BTC';
    local config: Config = Config(
        block_ts=block_ts,
        allowed_signer_addresses=allowed_signer_addresses,
        requested_feed_ids=requested_feed_ids,
        signer_count_treshold=1,
    );

    let (payload, _, _) = redstone_process_payload(
        data_ptr=data_ptr, data_length=data_ptr_len, config=config
    );

    let price = get_price(payload=payload, package_index=0, feed_id='BTC');
    btc_price.write(price);

    return ();
}

@view
func get_btc_price{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    res: felt
) {
    let (price) = btc_price.read();

    return (res=price);
}

@view
func get_signer_addresses{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    res_len: felt, res: felt*
) {
    let addresses = get_allowed_signer_addresses();

    return (res_len=addresses.len, res=addresses.ptr);
}

func write_addresses{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    ptr: felt*, len: felt, index: felt
) {
    if (len == index) {
        return ();
    }

    signer_address.write(index, ptr[index]);

    return write_addresses(ptr=ptr, len=len, index=index + 1);
}

func get_allowed_signer_addresses{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    ) -> Array {
    alloc_locals;

    let (addresses_len) = signer_address_len.read();
    let arr = array_new(len=addresses_len);

    _get_allowed_signer_addresses(index=0, res=arr);

    return arr;
}

func _get_allowed_signer_addresses{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    index: felt, res: Array
) {
    if (index == res.len) {
        return ();
    }

    let (address) = signer_address.read(index);
    assert res.ptr[index] = address;

    return _get_allowed_signer_addresses(index=index + 1, res=res);
}
