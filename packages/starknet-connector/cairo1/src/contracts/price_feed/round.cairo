use serde::Serde;
use array::ArrayTrait;
use array::SpanTrait;
use integer::Into;

struct Round {
    round_id: felt252,
    answer: felt252,
    block_num: felt252,
    started_at: felt252,
    updated_at: felt252,
}

impl RoundSerde of Serde<Round> {
    fn serialize(ref serialized: Array<felt252>, input: Round) {
        serialized.append(input.round_id);
        serialized.append(input.answer);
        serialized.append(input.block_num);
        serialized.append(input.started_at);
        serialized.append(input.updated_at);
    }

    fn deserialize(ref serialized: Span<felt252>) -> Option<Round> {
        Option::Some(
            Round {
                round_id: *serialized.pop_front()?,
                answer: *serialized.pop_front()?,
                block_num: *serialized.pop_front()?,
                started_at: *serialized.pop_front()?,
                updated_at: *serialized.pop_front()?
            }
        )
    }
}
