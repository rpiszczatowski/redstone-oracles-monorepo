use redstone::protocol::Payload;

#[derive(Copy, Drop)]
struct Results {
    payload: Payload,
    values: @Array<@Array<felt252>>,
    aggregated_values: @Array<felt252>,
}
