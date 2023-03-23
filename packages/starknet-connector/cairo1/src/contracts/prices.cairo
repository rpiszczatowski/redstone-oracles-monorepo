#[contract]
mod HelloStarknet {
    use core::array::array_new;
    use core::array::ArrayTrait;

    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use starknet::info::get_block_timestamp;

    use redstone::processor::process_payload;
    use redstone::config::Config;

    #[external]
    fn get_prices(feed_ids: Array<felt252>, payload_bytes: Array<u8>, ) -> Array<felt252> {
        let config = Config {
            block_timestamp: get_block_timestamp(),
            feed_ids: @feed_ids,
            signer_count_threshold: 1_usize,
            signers: @ArrayTrait::new()
        };

        process_payload(:payload_bytes, :config)
    }
}
