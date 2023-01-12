%builtins output range_check bitwise

from starkware.cairo.common.serialize import serialize_word
from starkware.cairo.common.cairo_builtins import BitwiseBuiltin

from redstone.protocol.payload import get_payload, serialize_payload, get_price
from redstone.processor import Config, process_payload

from redstone.utils.array import array_new

func main{output_ptr: felt*, range_check_ptr, bitwise_ptr: BitwiseBuiltin*}() {
    alloc_locals;

    local payload_data_ptr: felt*;
    local payload_data_length;
    local block_ts;

    %{
        bytes = program_input['bytes']
        ids.payload_data_ptr = payload_data_ptr = segments.add()
        for i, val in enumerate(bytes):
            memory[payload_data_ptr + i] = val

        ids.payload_data_length = len(bytes)
        ids.block_ts = program_input['timestamp']
    %}

    let allowed_signer_addresses = array_new(len=3);
    assert allowed_signer_addresses.ptr[0] = 0x109B4a318A4F5ddcbCA6349B45f881B4137deaFB;
    assert allowed_signer_addresses.ptr[1] = 0x12470f7aba85c8b81d63137dd5925d6ee114952b;
    assert allowed_signer_addresses.ptr[2] = 0x1ea62d73edf8ac05dfcea1a34b9796e937a29eff;

    local config: Config = Config(
        block_ts=block_ts, allowed_signer_addresses=allowed_signer_addresses
    );

    let payload = process_payload(
        data_ptr=payload_data_ptr, data_length=payload_data_length, config=config
    );
    get_price(payload=payload, package_index=0, dp_index=1);
    serialize_word([ap - 1]);

    serialize_payload(payload);

    return ();
}
