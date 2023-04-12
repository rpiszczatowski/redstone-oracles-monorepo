use alpha6::gas::out_of_gas_array;
use array::ArrayTrait;

fn find_price(
    feed_id: felt252, feed_ids: Array<felt252>, prices: Array<felt252>, index: usize
) -> felt252 {
    match gas::withdraw_gas_all(get_builtin_costs()) {
        Option::Some(_) => {},
        Option::None(_) => panic(out_of_gas_array()),
    };

    if (index == feed_ids.len()) {
        return 0;
    }

    if (feed_id == *feed_ids.at(index)) {
        return *prices.at(index);
    }

    find_price(:feed_id, :feed_ids, :prices, index: index + 1_usize)
}
