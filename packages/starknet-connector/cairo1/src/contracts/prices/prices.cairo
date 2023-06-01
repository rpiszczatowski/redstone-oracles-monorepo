#[contract]
mod HelloStarknet {
    use array::array_new;
    use array::ArrayTrait;
    use traits::Into;
    use traits::TryInto;
    use option::OptionTrait;

    use starknet::info::get_block_timestamp;

    use redstone::processor::process_payload;
    use redstone::config::Config;
    use redstone::sliceable_array::ArrayCopy;
    use redstone::sliceable_array::SliceableArrayTrait;
    use redstone::sliceable_array::SliceableArray;
    use redstone::numbers::Felt252PartialOrd;

    use utils::serde_storage::StorageAccessSerde;
    use utils::gas::out_of_gas_array;

    struct Storage {
        signer_count: usize,
        signers: Array<felt252>,
        price_values: LegacyMap::<felt252, felt252>,
        timestamp: felt252
    }

    #[constructor]
    fn constructor(signer_count_threshold: felt252, signer_addresses: Array<felt252>) {
        assert(signer_count_threshold > 0, 'Wrong signer count threshold');
        assert(
            signer_addresses.len().into() >= signer_count_threshold, 'Wrong number of addresses'
        );

        signer_count::write(signer_count_threshold.try_into().unwrap());
        signers::write(signer_addresses);
    }

    #[view]
    fn get_prices(feed_ids: Array<felt252>, payload_bytes: Array<u8>, ) -> Array<felt252> {
        let config = Config {
            block_timestamp: get_block_timestamp(),
            feed_ids: @feed_ids,
            signer_count_threshold: signer_count::read(),
            signers: @signers::read()
        };

        let results = process_payload(:payload_bytes, :config);
        results.aggregated_values.copied()
    }


    #[view]
    fn read_timestamp() -> felt252 {
        timestamp::read()
    }

    #[view]
    fn read_prices(feed_ids: Array<felt252>) -> Array<felt252> {
        let mut result = Default::default();

        read_price_values(:feed_ids, index: 0, ref :result);

        result
    }

    #[external]
    fn write_prices(feed_ids: Array<felt252>, payload_bytes: Array<u8>, ) {
        let config = Config {
            block_timestamp: get_block_timestamp(),
            feed_ids: @feed_ids,
            signer_count_threshold: signer_count::read(),
            signers: @signers::read()
        };

        let results = process_payload(:payload_bytes, :config);

        write_price_values(:feed_ids, values: results.aggregated_values, index: 0);
        timestamp::write(results.min_timestamp);
    }

    fn write_price_values(feed_ids: Array<felt252>, values: @Array<felt252>, index: usize) {
        match gas::withdraw_gas_all(get_builtin_costs()) {
            Option::Some(_) => {},
            Option::None(_) => panic(out_of_gas_array()),
        };

        if (feed_ids.len() == index) {
            return ();
        }

        price_values::write(*feed_ids[index], *values[index]);

        write_price_values(:feed_ids, :values, index: index + 1)
    }

    fn read_price_values(feed_ids: Array<felt252>, index: usize, ref result: Array<felt252>) {
        match gas::withdraw_gas_all(get_builtin_costs()) {
            Option::Some(_) => {},
            Option::None(_) => panic(out_of_gas_array()),
        };

        if (index == feed_ids.len()) {
            return ();
        }

        let value = price_values::read(*feed_ids[index]);
        result.append(value);

        read_price_values(:feed_ids, index: index + 1, ref :result)
    }
}

