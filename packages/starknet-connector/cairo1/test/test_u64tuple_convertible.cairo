const MAX_U64: u64 = 18446744073709551615;
const MAX_FELT252: felt252 = 0x800000000000011000000000000000000000000000000000000000000000000;

use redstone::u64tuple_convertible::U64TupleConvertible;
use redstone::u64tuple_convertible::U64TupleFelt252Convertible;
use redstone::u64tuple_convertible::TupleSize4PartialEq;
use redstone::u64tuple_convertible::U64_TUPLE_MAX_A;
use redstone::felt252_convertible::Felt252Convertible;


#[test]
fn test_u64tuple_convertible() {
    test_u64tuple_felt252_conversion((2, 546333400, 11, 1677563199), 0x200000000209062d8000000000000000b0000000063fd953f);
}

#[test]
fn test_u64tuple_convertible_almost_max() {
    test_u64tuple_felt252_conversion((13 , MAX_U64, MAX_U64, MAX_U64), 0xdffffffffffffffffffffffffffffffffffffffffffffffff);
}

#[test]
fn test_u64tuple_convertible_max_a() {
    test_u64tuple_felt252_conversion((U64_TUPLE_MAX_A , 0, 0, 0), 0x800000000000000000000000000000000000000000000000000000000000000);
}

#[should_panic]
#[test]
fn test_u64tuple_convertible_max_a_overflow() {
    test_u64tuple_felt252_conversion((U64_TUPLE_MAX_A + 1, 0, 0, 0), 0x0);
}

fn test_u64tuple_felt252_conversion(tuple: (u64, u64, u64, u64), value: felt252) {
    assert(tuple.to_felt252() == value, 'Wrong Felt252 Conversion');

    let result: (u64, u64, u64, u64) = U64TupleFelt252Convertible::from_felt252(value);
    assert(result== tuple, 'Wrong Tuple Conversion');
}