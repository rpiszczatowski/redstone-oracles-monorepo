use serde::Serde;
use array::ArrayTrait;
use array::SpanTrait;

struct RoundData {
    payload_timestamp: felt252,
    round: felt252,
    block_number: felt252,
    block_timestamp: felt252
}

impl RoundDataSerde of Serde::<RoundData> {
    fn serialize(ref serialized: Array<felt252>, input: RoundData) {
        serialized.append(input.payload_timestamp);
        serialized.append(input.round);
        serialized.append(input.block_number);
        serialized.append(input.block_timestamp);
    }

    fn deserialize(ref serialized: Span<felt252>) -> Option<RoundData> {
        Option::Some(
            RoundData {
                payload_timestamp: *serialized.pop_front()?,
                round: *serialized.pop_front()?,
                block_number: *serialized.pop_front()?,
                block_timestamp: *serialized.pop_front()?
            }
        )
    }
}
