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

    %{
        ids.payload_data_ptr = payload_data_ptr = segments.add()
        for i, val in enumerate(program_input):
            memory[payload_data_ptr + i] = val

        ids.payload_data_length = len(program_input)
    %}

    let allowed_signer_addresses = array_new(len=1);
    let block_ts = 1673007000;
    assert allowed_signer_addresses.ptr[0] = 0x109B4a318A4F5ddcbCA6349B45f881B4137deaFB;

    local config: Config = Config(
        block_ts=block_ts, allowed_signer_addresses=allowed_signer_addresses
    );

    let payload = process_payload(
        data_ptr=payload_data_ptr, data_length=payload_data_length, config=config
    );
    get_price(payload, 0, 1);

    return ();
}
