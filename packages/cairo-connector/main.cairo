%builtins output range_check bitwise

from starkware.cairo.common.serialize import serialize_word
from starkware.cairo.common.cairo_builtins import BitwiseBuiltin

from redstone.protocol.payload import get_payload, serialize_payload, get_price
from redstone.crypto.secp import verify_message

func main{output_ptr: felt*, range_check_ptr, bitwise_ptr: BitwiseBuiltin*}() {
    alloc_locals;

    local payload_data_ptr: felt*;
    local payload_data_length;

    %{
        ids.payload_data_ptr = payload_data_ptr = segments.add()
        for i, val in enumerate(program_input):
            memory[payload_data_ptr + i] = val

        ids.payload_data_length = len(program_input)
    %}

    let payload = get_payload(data_ptr=payload_data_ptr, data_length=payload_data_length);
    get_price(payload, 0, 1);

    let address = 0x109B4a318A4F5ddcbCA6349B45f881B4137deaFB;

    verify_message(
        signable_arr=payload.data_packages.ptr[0].signable_arr,
        signature=payload.data_packages.ptr[0].signature,
        eth_address=address,
    );

    return ();
}
