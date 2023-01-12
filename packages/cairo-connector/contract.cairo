%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin, BitwiseBuiltin
from starkware.cairo.common.math import assert_nn, assert_le

from starkware.starknet.common.syscalls import get_block_timestamp

from redstone.protocol.payload import Payload, get_price
from redstone.processor import Config, process_payload as redstone_process_payload

from redstone.utils.array import Array, array_new

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
    local config: Config = Config(
        block_ts=block_ts, allowed_signer_addresses=allowed_signer_addresses
    );

    let payload = redstone_process_payload(
        data_ptr=data_ptr, data_length=data_ptr_len, config=config
    );

    let price = get_price(payload=payload, package_index=0, dp_index=2);
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
    res: (felt, felt, felt, felt, felt, felt)
) {
    let addresses = get_allowed_signer_addresses();

    return (
        res=(
            addresses.ptr[0],
            addresses.ptr[1],
            addresses.ptr[2],
            addresses.ptr[3],
            addresses.ptr[4],
            addresses.ptr[5],
        ),
    );
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

    let index = 0;
    let (address) = signer_address.read(index);
    arr.ptr[index] = address;

    let index = 1;
    let (address) = signer_address.read(index);
    arr.ptr[index] = address;

    let index = 2;
    let (address) = signer_address.read(index);
    arr.ptr[index] = address;

    let index = 3;
    let (address) = signer_address.read(index);
    arr.ptr[index] = address;

    let index = 4;
    let (address) = signer_address.read(index);
    arr.ptr[index] = address;

    let index = 5;
    let (address) = signer_address.read(index);
    arr.ptr[index] = address;

    // _get_allowed_signer_addresses(index=0, res=addresses_arr);

    return arr;
}

// Causes: Expected a constant offset in the range [-2^15, 2^15).
// func _get_allowed_signer_addresses{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
//     index: felt, res: Array
// ) {
//     if (index == res.len) {
//         return ();
//     }

// let (address) = signer_address.read(index);
//     res.ptr[index] = address;

// return _get_allowed_signer_addresses(index=index + 1, res=res);
// }
