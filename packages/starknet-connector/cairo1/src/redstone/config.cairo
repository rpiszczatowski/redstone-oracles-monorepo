use array::ArrayTrait;

use redstone::validation::validate_timestamp;
use redstone::index_of::IndexOfTrait;
use redstone::protocol::DataPackage;

#[derive(Copy, Drop)]
struct Config {
    signers: @Array<felt252>,
    feed_ids: @Array<felt252>,
    signer_count_threshold: usize,
    block_timestamp: u64, // unix
}

trait ConfigurableTrait<T> {
    fn cap(self: T, tmp_signer_count: usize) -> usize;
    fn feed_index(
        self: T, feed_id: felt252, signer_index: usize, tmp_signer_count: usize
    ) -> Option<usize>;
    fn validate_signer(self: T, data_package: DataPackage) -> Option<usize>;
}

impl ConfigurableConfig of ConfigurableTrait<Config> {
    fn cap(self: Config, tmp_signer_count: usize) -> usize {
        self.feed_ids.len() * tmp_signer_count
    }

    fn feed_index(
        self: Config, feed_id: felt252, signer_index: usize, tmp_signer_count: usize
    ) -> Option<usize> {
        let feed_index = self.feed_ids.index_of(feed_id);

        match feed_index {
            Option::Some(index) => Option::Some(
                index_in_array(feed_index: index, :signer_index, signer_count: tmp_signer_count)
            ),
            Option::None(_) => Option::None(()),
        }
    }

    fn validate_signer(self: Config, data_package: DataPackage) -> Option<usize> {
        self.signers.index_of(data_package.signer_address);

        Option::Some(data_package.index)
    }
}

fn index_in_array(feed_index: usize, signer_index: usize, signer_count: usize) -> usize {
    feed_index * signer_count + signer_index
}
