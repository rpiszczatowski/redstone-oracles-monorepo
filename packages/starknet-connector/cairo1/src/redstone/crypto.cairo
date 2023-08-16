use core::traits::{Into, TryInto};
use ecdsa::check_ecdsa_signature;
use hash::LegacyHash;
use array::SpanTrait;
use array::ArrayTrait;
use integer::u8_to_felt252;
use option::OptionTrait;

use starknet::secp256k1::{recover_public_key_u32, public_key_point_to_eth_address};
use keccak::cairo_keccak;

use debug::PrintTrait;

use redstone::gas::out_of_gas_array;
use redstone::signature::Signature;
use redstone::number_convertible_array::NumberConvertibleArrayTrait;

trait VerifiableTrait<T> {
    fn verify(message_hash: u256, signature: Signature, public_key: felt252) -> bool;
    fn hash(self: @Array<T>) -> u256;
}

impl VerifiableU8Array of VerifiableTrait<u8> {
    fn verify(message_hash: u256, signature: Signature, public_key: felt252) -> bool {
        let key = recover_public_key_u32(
            msg_hash: message_hash,
            r: signature.r_bytes.to_u256(),
            s: signature.s_bytes.to_u256(),
            v: signature.v.into()
        );

        match key {
            Option::Some(pub_key) => {
                public_key_point_to_eth_address(pub_key).address == public_key
            },
            Option::None(_) => false
        }
    }

    fn hash(self: @Array<u8>) -> u256 {
        let mut span = self.span();
        let mut keccak_input: Array::<u64> = Default::default();
        let (size, value) = span_keccak_input_le(
            arr: span, index: 0_usize, mlt: 1, value: 0, ref result: keccak_input
        );

        let res = cairo_keccak(
            ref input: keccak_input, last_input_word: value, last_input_num_bytes: size
        );

        res.print();

        res
    }
}


fn span_keccak_input_le(
    mut arr: Span<u8>, index: usize, mlt: u64, value: u64, ref result: Array<u64>
) -> (usize, u64) {
    match gas::withdraw_gas_all(get_builtin_costs()) {
        Option::Some(_) => {},
        Option::None(_) => panic(out_of_gas_array()),
    };

    if (index == 8) {
        result.append(value);

        return span_keccak_input_le(:arr, index: 0, mlt: 1, value: 0, ref :result);
    }

    let item = arr.pop_front();
    match item {
        Option::Some(x) => {
            return span_keccak_input_le(
                :arr,
                index: index + 1_usize,
                mlt: if (index == 7) {
                    0
                } else {
                    mlt * 256
                },
                value: value + mlt * (*x).into(),
                ref :result
            );
        },
        Option::None(_) => {
            return (index, value);
        },
    }
}
