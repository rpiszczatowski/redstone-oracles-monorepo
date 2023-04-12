#[contract]
mod PriceManager {
    use array::ArrayTrait;

    use box::BoxTrait;
    use option::OptionTrait;
    use integer::u64_try_from_felt252;
    use integer::Into;

    use starknet::ContractAddress;
    use starknet::contract_address_try_from_felt252;
    use starknet::get_caller_address;
    use starknet::info::get_block_info;

    use alpha6::array_storage::StorageAccessArrayFelt252;
    use alpha6::core::find_price;

    use interface::round_data::RoundData;
    use interface::round_data::RoundDataSerde;

    struct Storage {
        owner: ContractAddress,
        feed_ids: Array<felt252>,
        prices: Array<felt252>,
        timestamp: u64,
        round_number: u64,
        block_number: u64,
        block_timestamp: u64,
    }

    #[constructor]
    fn constructor(owner_address: felt252) {
        owner::write(contract_address_try_from_felt252(owner_address).unwrap());
    }

    #[external]
    fn write_prices(
        rnd_number: felt252,
        feed_ids_arr: Array<felt252>,
        prices_arr: Array<felt252>,
        timestamp: felt252
    ) {
        assert(owner::read() == get_caller_address(), 'Caller is not the owner');
        assert(feed_ids_arr.len() == prices_arr.len(), 'Different array lengths');

        let timestamp_u64 = u64_try_from_felt252(timestamp).unwrap();
        assert(timestamp_u64 < 10000000000_u64, 'Timestamp must be normalized');
        assert(timestamp_u64 > timestamp::read(), 'Wrong timestamp');

        let round_number_u64 = u64_try_from_felt252(rnd_number).unwrap();
        assert(round_number_u64 == round_number::read() + 1_u64, 'Wrong round number');

        let block_info = get_block_info().unbox();

        block_number::write(block_info.block_number);
        block_timestamp::write(block_info.block_timestamp);
        feed_ids::write(feed_ids_arr);
        prices::write(prices_arr);
        round_number::write(round_number_u64);
        timestamp::write(timestamp_u64);
    }

    #[view]
    fn read_price(feed_id: felt252) -> felt252 {
        find_price(:feed_id, feed_ids: feed_ids::read(), prices: prices::read(), index: 0_usize)
    }

    #[view]
    fn read_round_data() -> RoundData {
        RoundData {
            payload_timestamp: timestamp::read().into(),
            round: round_number::read().into(),
            block_number: block_number::read().into(),
            block_timestamp: block_timestamp::read().into()
        }
    }
}
