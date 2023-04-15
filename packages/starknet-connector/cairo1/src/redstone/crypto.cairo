use ecdsa::check_ecdsa_signature;
use hash::LegacyHash;
use array::SpanTrait;
use array::ArrayTrait;
use integer::u8_to_felt252;

use redstone::gas::out_of_gas_array;
use redstone::signature::Signature;
use redstone::number_convertible_array::NumberConvertibleArrayTrait;

trait VerifiableTrait<T> {
    fn verify(message_hash: felt252, signature: Signature, public_key: felt252) -> bool;
    fn hash(self: @Array<T>) -> felt252;
}

impl VerifiableU8Array of VerifiableTrait<u8> {
    fn verify(message_hash: felt252, signature: Signature, public_key: felt252) -> bool {
        check_ecdsa_signature(
            :message_hash,
            :public_key,
            signature_r: signature.r_bytes.to_felt252(),
            signature_s: signature.s_bytes.to_felt252()
        )
    }

    fn hash(self: @Array<u8>) -> felt252 {
        hash_span(0, self.span())
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

