#[contract]
mod PriceFeed {
    use option::OptionTrait;

    use starknet::ContractAddress;
    use starknet::contract_address_try_from_felt252;

    use interface::price_manager_interface::IPriceManagerDispatcher;
    use interface::price_manager_interface::IPriceManagerDispatcherTrait;

    use price_feed::round::Round;

    struct Storage {
        manager_contract_address: ContractAddress,
        feed_identifier: felt252,
    }

    #[constructor]
    fn constructor(manager_address: felt252, feed_id: felt252) {
        manager_contract_address::write(
            contract_address_try_from_felt252(manager_address).unwrap()
        );
        feed_identifier::write(feed_id);
    }

    #[view]
    fn latest_round_data() -> Round {
        let manager = IPriceManagerDispatcher {
            contract_address: manager_contract_address::read()
        };

        let round_data = manager.read_round_data();
        let price = manager.read_price(feed_identifier::read());

        Round {
            round_id: round_data.round,
            answer: price,
            block_num: round_data.block_number,
            started_at: round_data.payload_timestamp,
            updated_at: round_data.block_timestamp,
        }
    }

    #[view]
    fn round_data(round_id: felt252) -> Round {
        panic(ArrayTrait::new())
    }

    #[view]
    fn description() -> felt252 {
        feed_identifier::read()
    }

    #[view]
    fn decimals() -> felt252 {
        8
    }

    #[view]
    fn type_and_version() -> felt252 {
        'alpha6'
    }
}
