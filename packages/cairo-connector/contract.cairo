%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin
from redstone.protocol.payload import Payload, get_payload, get_price

@storage_var
func btc_price() -> (res: felt) {
}

@external
func process_payload{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    data_ptr_len: felt, data_ptr: felt*
) {
    let payload = get_payload(data_ptr=data_ptr, data_length=data_ptr_len);
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
