use core::traits::Into;
use ecdsa::check_ecdsa_signature;
use hash::LegacyHash;
use array::SpanTrait;
use array::ArrayTrait;
use integer::u8_to_felt252;
use option::OptionTrait;

use starknet::secp256k1::{recover_public_key_u32, public_key_point_to_eth_address};
use keccak::keccak_u256s_le_inputs;

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
        let mut keccak_input: Array::<u256> = Default::default();

        loop {
            match gas::withdraw_gas_all(get_builtin_costs()) {
                Option::Some(_) => {},
                Option::None(_) => panic(out_of_gas_array()),
            };

            match span.pop_front() {
                Option::Some(v) => {
                    keccak_input.append(u256 { low: (*v).into(), high: 0 })
                },
                Option::None(_) => {
                    break ();
                }
            };
        };

        keccak_u256s_le_inputs(keccak_input.span())
    }
}


fn hash_span(state: felt252, mut value: Span<u8>) -> felt252 {
    match gas::withdraw_gas_all(get_builtin_costs()) {
        Option::Some(_) => {},
        Option::None(_) => panic(out_of_gas_array()),
    };

    let item = value.pop_front();
    match item {
        Option::Some(x) => {
            let s = LegacyHash::hash(u8_to_felt252(*x), state);
            hash_span(s, value)
        },
        Option::None(_) => state,
    }
}
