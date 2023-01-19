%builtins output range_check bitwise

from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.serialize import serialize_word
from starkware.cairo.common.cairo_builtins import HashBuiltin, BitwiseBuiltin

from redstone.protocol.payload import serialize_payload

from redstone.utils.array import array_new, serialize_array

from redstone.core.config import Config
from redstone.core.processor import process_payload
from redstone.core.results import serialize_results

func main{output_ptr: felt*, range_check_ptr, bitwise_ptr: BitwiseBuiltin*}() {
    alloc_locals;

    local payload_data_ptr: felt*;
    local payload_data_len;
    local block_ts;

    %{
        bytes = program_input['bytes']
        ids.payload_data_ptr = payload_data_ptr = segments.add()
        for i, val in enumerate(bytes):
            memory[payload_data_ptr + i] = val

        ids.payload_data_len = len(bytes)
        ids.block_ts = program_input['timestamp']
    %}

    let allowed_signer_addresses = array_new(len=5);
    assert allowed_signer_addresses.ptr[0] = 0x109B4a318A4F5ddcbCA6349B45f881B4137deaFB;
    assert allowed_signer_addresses.ptr[1] = 0x12470f7aba85c8b81d63137dd5925d6ee114952b;
    assert allowed_signer_addresses.ptr[2] = 0x1ea62d73edf8ac05dfcea1a34b9796e937a29eff;
    assert allowed_signer_addresses.ptr[3] = 0x83cba8c619fb629b81a65c2e67fe15cf3e3c9747;
    assert allowed_signer_addresses.ptr[4] = 0x2c59617248994D12816EE1Fa77CE0a64eEB456BF;

    let requested_feed_ids = array_new(len=2);
    assert requested_feed_ids.ptr[0] = 'BTC';
    assert requested_feed_ids.ptr[1] = 'ETH';

    local config: Config = Config(
        block_ts=block_ts,
        allowed_signer_addresses=allowed_signer_addresses,
        requested_feed_ids=requested_feed_ids,
        signer_count_treshold=1,
    );

    let (payload, results, aggregated) = process_payload(
        data_ptr=payload_data_ptr, data_len=payload_data_len, config=config
    );

    serialize_payload(payload);
    serialize_results(arr=results, index=0);
    serialize_array(arr=aggregated, index=0);

    return ();
}
