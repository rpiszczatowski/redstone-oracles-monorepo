use serde::Serde;
use array::ArrayTrait;
use array::SpanTrait;
use integer::Into;
use integer::TryInto;
use integer::u64_try_from_felt252;
use option::OptionTrait;

#[derive(Drop)]
struct RoundData {
    round_number: u64,
    payload_timestamp: u64,
    block_number: u64,
    block_timestamp: u64
}

impl RoundDataSerde of Serde<RoundData> {
    fn serialize(ref serialized: Array<felt252>, input: RoundData) {
        serialized.append(input.round_number.into());
        serialized.append(input.payload_timestamp.into());
        serialized.append(input.block_number.into());
        serialized.append(input.block_timestamp.into());
    }

    fn deserialize(ref serialized: Span<felt252>) -> Option<RoundData> {
        Option::Some(
            RoundData {
                round_number: deserialize_u64_from_felt252(ref :serialized).unwrap(),
                payload_timestamp: deserialize_u64_from_felt252(ref :serialized).unwrap(),
                block_number: deserialize_u64_from_felt252(ref :serialized).unwrap(),
                block_timestamp: deserialize_u64_from_felt252(ref :serialized).unwrap()
            }
        )
    }
}

fn deserialize_u64_from_felt252(ref serialized: Span<felt252>) -> Option<u64> {
    u64_try_from_felt252(*serialized.pop_front()?)
}
