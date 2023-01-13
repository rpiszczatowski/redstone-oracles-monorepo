%builtins output range_check bitwise

from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.serialize import serialize_word
from starkware.cairo.common.cairo_builtins import HashBuiltin, BitwiseBuiltin

from redstone.protocol.payload import serialize_payload

from redstone.utils.array import array_new, serialize_array

from redstone.config import Config
from redstone.processor import process_payload
from redstone.results import serialize_results

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

    let requested_feed_ids = array_new(len=3);
    assert requested_feed_ids.ptr[0] = 'BTC';
    assert requested_feed_ids.ptr[1] = 'ETH';
    assert requested_feed_ids.ptr[2] = 'sth_wrong';

    local config: Config = Config(
        block_ts=block_ts,
        allowed_signer_addresses=allowed_signer_addresses,
        requested_feed_ids=requested_feed_ids,
        signer_count_treshold=1,
    );

    let (payload, results) = process_payload(
        data_ptr=payload_data_ptr, data_length=payload_data_length, config=config
    );

    serialize_payload(payload);
    serialize_results(arr=results, index=0);

    return ();
}
