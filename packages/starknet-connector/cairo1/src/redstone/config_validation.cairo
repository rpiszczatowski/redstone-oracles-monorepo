use integer::u32_to_felt252;
use array::ArrayTrait;

use redstone::config::ConfigurableTrait;
use redstone::config::Config;
use redstone::protocol::DataPackage;
use redstone::timestamp_validation::validate_timestamp;

use redstone::crypto::VerifiableTrait;
use redstone::crypto::VerifiableU8Array;
use redstone::gas::out_of_gas_array;
use redstone::signature::RedstoneSignature;

/// 655360000 + feed_index + 10000 * count
const INSUFFICIENT_SIGNER_COUNT: felt252 = 0x27100000;

/// 1310720000 + data_package_index
const SIGNER_NOT_RECOGNIZED: felt252 = 0x4e200000;

trait ValidableTrait<T> {
    fn validate_timestamp(self: T, index: usize, timestamp: felt252);
    fn validate_signer_count(self: T, feed_index: usize, count: usize);
    fn signer_index(self: T, data_package: DataPackage) -> Option<usize>;
}

impl ValidableConfig of ValidableTrait<Config> {
    fn validate_timestamp(self: Config, index: usize, timestamp: felt252) {
        validate_timestamp(:index, :timestamp, block_timestamp: self.block_timestamp);
    }

    fn validate_signer_count(self: Config, feed_index: usize, count: usize) {
        assert(
            count >= self.signer_count_threshold,
            INSUFFICIENT_SIGNER_COUNT + u32_to_felt252(feed_index + 10000_usize * count)
        );
    }

    fn signer_index(self: Config, data_package: DataPackage) -> Option<usize> {
        _signer_index(
            signers: self.signers,
            hash: data_package.signable_bytes.hash(),
            signature: data_package.signature,
            index: 0_usize
        )
    }
}


fn _signer_index(
    signers: @Array<felt252>, hash: u256, signature: RedstoneSignature, index: usize
) -> Option<usize> {
    match gas::withdraw_gas_all(get_builtin_costs()) {
        Option::Some(_) => {},
        Option::None(_) => panic(out_of_gas_array()),
    };

    if (index == signers.len()) {
        return Option::None(());
    }

    let result = VerifiableU8Array::verify(
        message_hash: hash, :signature, public_key: *signers[index]
    );

    if result {
        return Option::Some(index);
    }

    _signer_index(:signers, :hash, :signature, index: index + 1)
}
