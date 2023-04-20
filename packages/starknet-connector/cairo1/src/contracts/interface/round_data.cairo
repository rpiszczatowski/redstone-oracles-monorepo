use serde::Serde;
use array::ArrayTrait;
use array::SpanTrait;

use utils::serde_storage::WrappedSerde;

impl RoundDataWrappedSerde of WrappedSerde<RoundData> {}

#[derive(Drop, Serde)]
struct RoundData {
    payload_timestamp: felt252,
    round: felt252,
    block_number: felt252,
    block_timestamp: felt252
}
