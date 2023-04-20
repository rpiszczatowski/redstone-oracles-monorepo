use redstone::protocol::Payload;

#[derive(Copy, Drop)]
struct Results {
    min_timestamp: felt252,
    values: @Array<@Array<felt252>>,
    aggregated_values: @Array<felt252>,
}
